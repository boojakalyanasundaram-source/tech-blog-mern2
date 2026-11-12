import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import PostCard from '../components/PostCard.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useFetch } from '../hooks/useFetch';
import { site } from '../config';
import { useCategories } from '../hooks/useFetch';
import SearchBox from '../components/SearchBox.jsx';

function CardSkeletons({ count = 4 }) {
  return (
    <div className="grid grid--2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <div className="skeleton" key={i} />)}
    </div>
  );
}

export default function Home() {
  const { data: featured, loading: l1, error: e1 } = useFetch('/posts/featured');
  const { data: latest, loading: l2, error: e2 } = useFetch('/posts/latest?limit=8&excludeFeatured=1');

  const categories = useCategories();
  const loading = l1 || l2;
  const hasFeatured = featured?.length > 0;
  // without featured articles the newest posts take the hero slots
  const heroPosts = hasFeatured ? featured : (latest || []).slice(0, 4);
  const latestPosts = hasFeatured ? latest || [] : (latest || []).slice(4);
  const [lead, ...rest] = heroPosts;

  return (
    <>
      <Seo
        description={site.description}
        path="/"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Blog', name: site.name, description: site.description, url: site.url }}
      />

      <section className="hero">
        <div className="container">
          <div className="hero-intro">
            <div className="hero-intro__copy">
              <span className="eyebrow"><span className="eyebrow__dot" /> THE SIGNAL IN TECHNOLOGY</span>
              <h1>Ideas that move <span>technology</span> forward.</h1>
              <p>Thoughtful perspectives, practical guides and the latest ideas shaping our digital world.</p>
              <div className="hero-intro__actions">
                <Link className="btn btn--primary" to="/blog">Explore articles <span aria-hidden="true">↗</span></Link>
                <a className="hero-text-link" href="#latest-title">Discover the latest <span aria-hidden="true">↓</span></a>
              </div>
            </div>
            <div className="hero-orbit" aria-hidden="true">
              <div className="hero-orbit__ring hero-orbit__ring--one" />
              <div className="hero-orbit__ring hero-orbit__ring--two" />
              <div className="hero-orbit__core"><span> T<span>✳</span></span><small>TECH / IDEAS / FUTURE</small></div>
              <i className="orbit-node orbit-node--one" /><i className="orbit-node orbit-node--two" /><i className="orbit-node orbit-node--three" />
            </div>
          </div>
          <div className="hero-discovery">
            <div><span className="hero-discovery__label">EXPLORE BY INTEREST</span><div className="topic-chips">{categories.slice(0, 6).map((c) => <Link key={c._id} to={`/category/${c.slug}`}>{c.name}<span>↗</span></Link>)}</div></div>
            <SearchBox className="search--hero" placeholder="Search ideas, topics, stories..." />
          </div>
          <h1 className="sr-only">{site.name}: {site.tagline}</h1>
          {(e1 || e2) && <p className="notice notice--error">Articles could not be loaded. Please refresh the page.</p>}
          {loading && <div className="hero__grid" aria-hidden="true"><div className="skeleton skeleton--tall" /><div className="skeleton skeleton--tall" /></div>}
          {!loading && lead && (
            <div className="hero__grid">
              <PostCard post={lead} variant="hero" eager />
              <div className="hero__side">
                <h2 className="section-title">{hasFeatured ? 'Featured' : 'Recent'}</h2>
                {rest.map((p) => <PostCard key={p._id} post={p} variant="compact" />)}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="container layout">
        <section className="layout__main" aria-labelledby="latest-title">
          <div className="section-head">
            <h2 id="latest-title" className="section-title">Latest articles</h2>
            <Link to="/blog" className="text-link">View all articles</Link>
          </div>
          {l2 ? <CardSkeletons /> : (
            <>
              {latestPosts.length === 0 && !lead && <p className="empty">No articles have been published yet. Check back soon.</p>}
              <div className="grid grid--2">
                {latestPosts.map((p) => <PostCard key={p._id} post={p} />)}
              </div>
              {latestPosts.length > 0 && (
                <p className="center"><Link className="btn btn--outline" to="/blog">Browse all articles</Link></p>
              )}
            </>
          )}
        </section>
        <Sidebar />
      </div>
    </>
  );
}
