import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import Post from '../models/Post.js';
import Category from '../models/Category.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/httpError.js';

export const seoRouter = Router();

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (url) => (!url ? '' : /^https?:/i.test(url) ? url : `${env.siteUrl}${url}`);

seoRouter.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(
    ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', '', `Sitemap: ${env.siteUrl}/sitemap.xml`, ''].join('\n')
  );
});

seoRouter.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const [posts, categories] = await Promise.all([
      Post.find({ status: 'published', publishedAt: { $lte: new Date() } }).select('slug updatedAt').sort({ publishedAt: -1 }).lean(),
      Category.find().select('slug updatedAt').lean(),
    ]);
    const url = (loc, lastmod, priority) =>
      `<url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}<priority>${priority}</priority></url>`;
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      url(`${env.siteUrl}/`, null, '1.0'),
      url(`${env.siteUrl}/blog`, null, '0.9'),
      ...categories.map((c) => url(`${env.siteUrl}/category/${c.slug}`, c.updatedAt, '0.7')),
      ...posts.map((p) => url(`${env.siteUrl}/blog/${p.slug}`, p.updatedAt, '0.8')),
      '</urlset>',
    ].join('\n');
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
  })
);

// ---- HTML shell with per-page meta tags (so crawlers and link previews see real metadata) ----

async function metaFor(pathname) {
  const base = {
    title: `${env.siteName} | Technology insights, tutorials and company news`,
    description: env.siteDescription,
    url: `${env.siteUrl}${pathname === '/' ? '/' : pathname}`,
    type: 'website',
    status: 200,
  };

  if (pathname === '/') return base;
  if (pathname === '/blog') {
    return { ...base, title: `All articles | ${env.siteName}`, description: `Browse every article on ${env.siteName}: software development, AI, cloud, security and more.` };
  }
  if (pathname.startsWith('/admin')) return { ...base, title: `Admin | ${env.siteName}`, noindex: true };

  let m = pathname.match(/^\/category\/([^/]+)\/?$/);
  if (m) {
    const category = await Category.findOne({ slug: m[1] }).lean();
    if (!category) return { ...base, title: `Not found | ${env.siteName}`, noindex: true, status: 404 };
    return {
      ...base,
      title: `${category.name} articles | ${env.siteName}`,
      description: category.description || `Read the latest ${category.name} articles on ${env.siteName}.`,
    };
  }

  m = pathname.match(/^\/blog\/([^/]+)\/?$/);
  if (m) {
    const post = await Post.findOne({ slug: m[1], status: 'published', publishedAt: { $lte: new Date() } })
      .select('-content -contentText')
      .populate('category', 'name')
      .populate('author', 'name')
      .populate('tags', 'name')
      .lean();
    if (!post) return { ...base, title: `Article not found | ${env.siteName}`, noindex: true, status: 404 };
    const description = post.metaDescription || post.excerpt || env.siteDescription;
    const image = abs(post.featuredImage);
    return {
      ...base,
      title: `${post.seoTitle || post.title} | ${env.siteName}`,
      description,
      image,
      type: 'article',
      url: `${env.siteUrl}/blog/${post.slug}`,
      published: post.publishedAt,
      modified: post.updatedAt,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description,
        ...(image ? { image: [image] } : {}),
        datePublished: new Date(post.publishedAt).toISOString(),
        dateModified: new Date(post.updatedAt).toISOString(),
        author: { '@type': 'Person', name: post.author?.name || env.siteName },
        publisher: { '@type': 'Organization', name: env.siteName },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${env.siteUrl}/blog/${post.slug}` },
        ...(post.category ? { articleSection: post.category.name } : {}),
        ...(post.tags?.length ? { keywords: post.tags.map((t) => t.name).join(', ') } : {}),
      },
    };
  }
  return { ...base, title: `Page not found | ${env.siteName}`, noindex: true, status: 404 };
}

function renderHead(meta) {
  const rh = 'data-rh="true"'; // lets react-helmet replace these tags once the app loads
  const tags = [
    `<meta name="description" content="${esc(meta.description)}" ${rh}>`,
    `<link rel="canonical" href="${esc(meta.url)}" ${rh}>`,
    meta.noindex ? `<meta name="robots" content="noindex,nofollow" ${rh}>` : '',
    `<meta property="og:site_name" content="${esc(env.siteName)}" ${rh}>`,
    `<meta property="og:type" content="${meta.type}" ${rh}>`,
    `<meta property="og:title" content="${esc(meta.title)}" ${rh}>`,
    `<meta property="og:description" content="${esc(meta.description)}" ${rh}>`,
    `<meta property="og:url" content="${esc(meta.url)}" ${rh}>`,
    meta.image ? `<meta property="og:image" content="${esc(meta.image)}" ${rh}>` : '',
    meta.published ? `<meta property="article:published_time" content="${new Date(meta.published).toISOString()}" ${rh}>` : '',
    meta.modified ? `<meta property="article:modified_time" content="${new Date(meta.modified).toISOString()}" ${rh}>` : '',
    `<meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}" ${rh}>`,
    `<meta name="twitter:title" content="${esc(meta.title)}" ${rh}>`,
    `<meta name="twitter:description" content="${esc(meta.description)}" ${rh}>`,
    meta.image ? `<meta name="twitter:image" content="${esc(meta.image)}" ${rh}>` : '',
    meta.jsonLd ? `<script type="application/ld+json" ${rh}>${JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')}</script>` : '',
    // Search Console verification and Google Analytics (GA4) are configured through environment variables
    env.gscVerification ? `<meta name="google-site-verification" content="${esc(env.gscVerification)}">` : '',
    env.gaId
      ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(env.gaId)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(env.gaId)}',{send_page_view:false});</script>`
      : '',
  ];
  return tags.filter(Boolean).join('\n');
}

export function htmlHandler(distDir) {
  let template;
  return asyncHandler(async (req, res) => {
    if (!template || !env.isProd) template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
    const meta = await metaFor(req.path);
    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
      .replace('</head>', `${renderHead(meta)}\n</head>`);
    res.status(meta.status).set('Cache-Control', 'no-cache').type('html').send(html);
  });
}
