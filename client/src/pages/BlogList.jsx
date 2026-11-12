import { useParams, useSearchParams, Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import PostCard from '../components/PostCard.jsx';
import Pagination from '../components/Pagination.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useCategories, useFetch } from '../hooks/useFetch';

export default function BlogList() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const categories = useCategories();

  const q = params.get('q') || '';
  const tag = params.get('tag') || '';
  const page = Math.max(parseInt(params.get('page'), 10) || 1, 1);
  const category = slug || params.get('category') || '';

  const query = new URLSearchParams({ page, limit: 10 });
  if (q) query.set('q', q);
  if (tag) query.set('tag', tag);
  if (category) query.set('category', category);

  const { data, loading, error } = useFetch(`/posts?${query}`);
  const activeCategory = categories.find((c) => c.slug === category);

  let heading = 'All articles';
  if (q) heading = `Results for “${q}”`;
  else if (activeCategory) heading = activeCategory.name;
  else if (tag) heading = `Tagged: ${data?.items?.[0]?.tags?.find((t) => t.slug === tag)?.name || tag}`;

  const goToPage = (n) => {
    const next = new URLSearchParams(params);
    if (n > 1) next.set('page', n); else next.delete('page');
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = q || tag ? <Link className="text-link" to={category ? `/category/${category}` : '/blog'}>Clear filters</Link> : null;

  return (
    <>
      <Seo
        title={q ? `Search: ${q}` : activeCategory ? `${activeCategory.name} articles` : 'All articles'}
        description={activeCategory?.description}
        noindex={!!q || !!tag || page > 1}
      />
      <div className="page-head">
        <div className="container">
          <h1>{heading}</h1>
          {activeCategory?.description && !q && <p>{activeCategory.description}</p>}
          {data && <p className="page-head__count">{data.total} {data.total === 1 ? 'article' : 'articles'} {clearFilters}</p>}
        </div>
      </div>

      <div className="container layout">
        <section className="layout__main" aria-live="polite">
          {error && <p className="notice notice--error">Articles could not be loaded. Please try again.</p>}
          {loading && !data && Array.from({ length: 4 }).map((_, i) => <div className="skeleton skeleton--row" key={i} aria-hidden="true" />)}
          {data && data.items.length === 0 && (
            <div className="empty">
              <p>{q ? `No articles match “${q}”. Try a different keyword.` : 'No articles here yet.'}</p>
              <Link className="btn btn--outline" to="/blog">View all articles</Link>
            </div>
          )}
          {data && data.items.map((p, i) => <PostCard key={p._id} post={p} variant="row" eager={i === 0} />)}
          {data && <Pagination page={data.page} pages={data.pages} onChange={goToPage} />}
        </section>
        <Sidebar />
      </div>
    </>
  );
}
