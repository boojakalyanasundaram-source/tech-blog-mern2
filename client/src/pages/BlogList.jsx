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

  const query = new URLSearchParams({ page: String(page), limit: '10' });

  if (q) query.set('q', q);
  if (tag) query.set('tag', tag);
  if (category) query.set('category', category);

  const { data, loading, error } = useFetch(`/posts?${query}`);

  const activeCategory = categories.find((c) => c.slug === category);

  const items = Array.isArray(data?.items) ? data.items : [];
  const total = Number(data?.total) || 0;
  const currentPage = Number(data?.page) || page;
  const pages = Number(data?.pages) || 1;

  let heading = 'All articles';

  if (q) {
    heading = `Results for “${q}”`;
  } else if (activeCategory) {
    heading = activeCategory.name;
  } else if (tag) {
    const firstPost = items[0];
    const matchingTag = Array.isArray(firstPost?.tags)
      ? firstPost.tags.find((t) => t.slug === tag)
      : null;

    heading = `Tagged: ${matchingTag?.name || tag}`;
  }

  const goToPage = (n) => {
    const next = new URLSearchParams(params);

    if (n > 1) {
      next.set('page', String(n));
    } else {
      next.delete('page');
    }

    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = q || tag ? (
    <Link
      className="text-link"
      to={category ? `/category/${category}` : '/blog'}
    >
      Clear filters
    </Link>
  ) : null;

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

          {activeCategory?.description && !q && (
            <p>{activeCategory.description}</p>
          )}

          {data && (
            <p className="page-head__count">
              {total} {total === 1 ? 'article' : 'articles'} {clearFilters}
            </p>
          )}
        </div>
      </div>

      <div className="container layout">
        <section className="layout__main" aria-live="polite">

          {error && (
            <p className="notice notice--error">
              Articles could not be loaded. Please try again.
            </p>
          )}

          {loading && !data && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  className="skeleton skeleton--row"
                  key={i}
                  aria-hidden="true"
                />
              ))}
            </>
          )}

          {!loading && !error && data && items.length === 0 && (
            <div className="empty">
              <p>
                {q
                  ? `No articles match “${q}”. Try a different keyword.`
                  : 'No articles here yet.'}
              </p>

              <Link className="btn btn--outline" to="/blog">
                View all articles
              </Link>
            </div>
          )}

          {items.map((post, i) => (
            <PostCard
              key={post._id || post.slug || i}
              post={post}
              variant="row"
              eager={i === 0}
            />
          ))}

          {data && pages > 1 && (
            <Pagination
              page={currentPage}
              pages={pages}
              onChange={goToPage}
            />
          )}

        </section>

        <Sidebar />
      </div>
    </>
  );
}