import { Link } from 'react-router-dom';
import SearchBox from './SearchBox.jsx';
import { useCategories, useFetch } from '../hooks/useFetch';

export default function Sidebar() {
  const categories = useCategories();
  const { data: trending } = useFetch('/posts/trending');
  const { data: tags } = useFetch('/tags');

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <section className="widget">
        <h2 className="widget__title">Search</h2>
        <SearchBox className="search--sidebar" />
      </section>

      {trending?.length > 0 && (
        <section className="widget">
          <h2 className="widget__title">Popular articles</h2>
          <ol className="trending">
            {trending.map((p) => (
              <li key={p._id}>
                <Link to={`/blog/${p.slug}`}>{p.title}</Link>
                {p.category && <span>{p.category.name}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {categories.length > 0 && (
        <section className="widget">
          <h2 className="widget__title">Browse by topic</h2>
          <ul className="topic-list">
            {categories.map((c) => (
              <li key={c._id}>
                <Link to={`/category/${c.slug}`}>{c.name}</Link>
                <span>{c.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tags?.length > 0 && (
        <section className="widget">
          <h2 className="widget__title">Popular tags</h2>
          <div className="tag-cloud">
            {tags.map((t) => (
              <Link key={t._id} to={`/blog?tag=${t.slug}`}>{t.name}</Link>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
