import { Helmet } from 'react-helmet-async';
import { site } from '../config';

export default function Seo({ title, description, image, path, type = 'website', jsonLd, noindex, published, modified }) {
  const fullTitle = title ? `${title} | ${site.name}` : `${site.name} | ${site.tagline}`;
  const desc = description || site.description;
  const url = site.url + (path ?? window.location.pathname);
  const img = image ? (image.startsWith('http') ? image : site.url + image) : '';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:site_name" content={site.name} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      {img && <meta property="og:image" content={img} />}
      {published && <meta property="article:published_time" content={new Date(published).toISOString()} />}
      {modified && <meta property="article:modified_time" content={new Date(modified).toISOString()} />}
      <meta name="twitter:card" content={img ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {img && <meta name="twitter:image" content={img} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
