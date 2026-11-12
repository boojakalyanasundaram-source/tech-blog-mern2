import { Link } from 'react-router-dom';
import { formatDate, hueFrom, srcSetOf, thumbOf } from '../utils';

export function Thumb({ post, eager, sizes = '(min-width: 900px) 360px, 100vw' }) {
  if (post.featuredImage) {
    return (
      <img
        src={thumbOf(post.featuredImage)}
        srcSet={srcSetOf(post.featuredImage)}
        sizes={sizes}
        alt={post.featuredImageAlt || ''}
        width="640"
        height="360"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  }
  const category = (post.category?.name || '').toLowerCase();
  const art = category.includes('ai') || category.includes('artificial') ? 'ai' : category.includes('cyber') || category.includes('security') ? 'security' : category.includes('cloud') ? 'cloud' : category.includes('code') || category.includes('program') ? 'code' : 'software';
  return (
    <div className={`thumb-fallback thumb-fallback--${art}`} style={{ '--h': hueFrom(post.title) }} aria-hidden="true">
      <img src={`/covers/${art}.svg`} alt="" loading="lazy" />
      <span className="thumb-fallback__label">{post.category?.name || 'TECH INSIGHT'}</span>
    </div>
  );
}

export function PostMeta({ post, showAuthor = true }) {
  return (
    <div className="post-meta">
      {showAuthor && post.author?.name && <span className="post-meta__author">{post.author.name}</span>}
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      {post.readingTime ? <span>{post.readingTime} min read</span> : null}
    </div>
  );
}

// variants: card (vertical), row (horizontal), hero (large lead story), compact (small thumbnail + title)
export default function PostCard({ post, variant = 'card', eager = false }) {
  const href = `/blog/${post.slug}`;
  return (
    <article className={`post-card post-card--${variant}`}>
      <Link to={href} className="post-card__media" tabIndex={-1} aria-hidden="true">
        <Thumb post={post} eager={eager} sizes={variant === 'hero' ? '(min-width: 900px) 640px, 100vw' : undefined} />
      </Link>
      <div className="post-card__body">
        {post.category && variant !== 'compact' && (
          <Link className="category-link" to={`/category/${post.category.slug}`}>{post.category.name}</Link>
        )}
        <h3 className="post-card__title"><Link to={href}>{post.title}</Link></h3>
        {variant !== 'compact' && <p className="post-card__excerpt">{post.excerpt}</p>}
        <PostMeta post={post} showAuthor={variant !== 'compact'} />
      </div>
    </article>
  );
}
