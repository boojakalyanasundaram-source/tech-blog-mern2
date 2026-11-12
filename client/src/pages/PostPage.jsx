import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/github-dark.css';
import Seo from '../components/Seo.jsx';
import PostCard from '../components/PostCard.jsx';
import ShareButtons from '../components/ShareButtons.jsx';
import NotFound from './NotFound.jsx';
import { useFetch } from '../hooks/useFetch';
import { formatDate, thumbOf } from '../utils';
import { site } from '../config';

function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div className="progress" role="presentation"><div style={{ width: `${pct}%` }} /></div>;
}

function Toc({ toc, activeId }) {
  if (toc.length < 3) return null;
  return (
    <nav className="toc" aria-label="Table of contents">
      <h2 className="widget__title">In this article</h2>
      <ul>
        {toc.map((h) => (
          <li key={h.id} className={`toc__l${h.level}${activeId === h.id ? ' is-active' : ''}`}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AdjacentLink({ post, dir }) {
  if (!post) return <span />;
  return (
    <Link to={`/blog/${post.slug}`} className={`adjacent adjacent--${dir}`} rel={dir === 'prev' ? 'prev' : 'next'}>
      <small>{dir === 'prev' ? 'Previous article' : 'Next article'}</small>
      <strong>{post.title}</strong>
    </Link>
  );
}

export default function PostPage() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(`/posts/${slug}`);
  const bodyRef = useRef(null);
  const [activeId, setActiveId] = useState('');

  // syntax highlighting + active heading in the table of contents
  useEffect(() => {
    const root = bodyRef.current;
    if (!root || !data) return undefined;
    root.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el));
    const headings = [...root.querySelectorAll('h2[id], h3[id]')];
    if (!headings.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [data]);

  if (error?.status === 404) return <NotFound message="This article may have been unpublished or the link is incorrect." />;
  if (error) return <div className="container"><p className="notice notice--error">The article could not be loaded. Please try again.</p></div>;
  if (loading || !data) return <div className="container article-wrap"><div className="skeleton skeleton--tall" aria-hidden="true" /></div>;

  const { post, html, toc, related, prev, next } = data;
  const image = post.featuredImage ? (post.featuredImage.startsWith('http') ? post.featuredImage : site.url + post.featuredImage) : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    ...(image ? { image: [image] } : {}),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author?.name || site.name },
    publisher: { '@type': 'Organization', name: site.name },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${site.url}/blog/${post.slug}` },
    ...(post.category ? { articleSection: post.category.name } : {}),
  };

  return (
    <>
      <Seo
        title={post.seoTitle || post.title}
        description={post.metaDescription || post.excerpt}
        image={post.featuredImage}
        type="article"
        path={`/blog/${post.slug}`}
        published={post.publishedAt}
        modified={post.updatedAt}
        jsonLd={jsonLd}
      />
      <ReadingProgress />

      <div className="container article-wrap">
        <header className="article-header">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <Link to="/blog">Blog</Link>
            {post.category && <Link to={`/category/${post.category.slug}`}>{post.category.name}</Link>}
          </nav>
          <h1>{post.title}</h1>
          {post.excerpt && <p className="article-header__lede">{post.excerpt}</p>}
          <div className="byline">
            {post.author?.avatar && <img src={thumbOf(post.author.avatar)} alt="" width="44" height="44" />}
            <div>
              <strong>{post.author?.name}</strong>
              <div className="post-meta">
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                <span>{post.readingTime} min read</span>
              </div>
            </div>
          </div>
        </header>

        {post.featuredImage && (
          <figure className="article-hero">
            <img src={post.featuredImage} alt={post.featuredImageAlt || ''} width="1200" height="630" decoding="async" fetchpriority="high" />
          </figure>
        )}

        <div className="article-layout">
          <article className="article-main">
            <details className="toc-mobile">
              <summary>Table of contents</summary>
              <Toc toc={toc} activeId={activeId} />
            </details>
            <div className="prose" ref={bodyRef} dangerouslySetInnerHTML={{ __html: html }} />

            {post.tags?.length > 0 && (
              <div className="tag-cloud article-tags">
                {post.tags.map((t) => <Link key={t._id} to={`/blog?tag=${t.slug}`}>{t.name}</Link>)}
              </div>
            )}

            <section className="share-block" aria-label="Share">
              <h2 className="widget__title">Share this article</h2>
              <ShareButtons title={post.title} />
            </section>

            {post.author && (
              <section className="author-box" aria-label="About the author">
                {post.author.avatar && <img src={thumbOf(post.author.avatar)} alt="" width="64" height="64" loading="lazy" />}
                <div>
                  <h2>{post.author.name}</h2>
                  {post.author.bio && <p>{post.author.bio}</p>}
                  <div className="author-box__links">
                    {post.author.linkedin && <a href={post.author.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
                    {post.author.twitter && <a href={post.author.twitter} target="_blank" rel="noopener noreferrer">X</a>}
                    {post.author.website && <a href={post.author.website} target="_blank" rel="noopener noreferrer">Website</a>}
                  </div>
                </div>
              </section>
            )}

            <nav className="adjacent-nav" aria-label="Previous and next articles">
              <AdjacentLink post={prev} dir="prev" />
              <AdjacentLink post={next} dir="next" />
            </nav>
          </article>

          <aside className="article-aside" aria-label="Article tools">
            <div className="article-aside__sticky">
              <Toc toc={toc} activeId={activeId} />
              <div className="widget">
                <h2 className="widget__title">Share</h2>
                <ShareButtons title={post.title} />
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="related" aria-labelledby="related-title">
            <h2 id="related-title" className="section-title">Related articles</h2>
            <div className="grid grid--3">
              {related.map((p) => <PostCard key={p._id} post={p} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
