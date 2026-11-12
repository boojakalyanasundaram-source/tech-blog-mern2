import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from './AuthContext.jsx';
import { formatDateTime } from '../utils';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useFetch('/admin/stats');

  return (
    <>
      <div className="admin__head">
        <div>
          <h1>Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="muted">Here is what is happening on the blog.</p>
        </div>
        <Link className="btn btn--primary" to="/admin/posts/new">Write an article</Link>
      </div>
      {error && <p className="notice notice--error">{error.message}</p>}
      {loading && <p className="muted">Loading…</p>}
      {data && (
        <>
          <div className="stats">
            <div className="stat"><strong>{data.posts.published}</strong><span>Published</span></div>
            <div className="stat"><strong>{data.posts.scheduled}</strong><span>Scheduled</span></div>
            <div className="stat"><strong>{data.posts.draft}</strong><span>Drafts</span></div>
            <div className="stat"><strong>{data.views.toLocaleString('en-IN')}</strong><span>Total views</span></div>
          </div>
          <div className="two-col">
            <section className="card">
              <h2>Recently edited</h2>
              {data.recent.length === 0 ? <p className="muted">Nothing yet. Start with your first article.</p> : (
                <ul className="plain-list">
                  {data.recent.map((p) => (
                    <li key={p._id}>
                      <Link to={`/admin/posts/${p._id}`}>{p.title}</Link>
                      <span className={`badge badge--${p.status}`}>{p.status}</span>
                      <small>{formatDateTime(p.updatedAt)}</small>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card">
              <h2>Most read</h2>
              {data.top.length === 0 ? <p className="muted">Views will appear once articles are published.</p> : (
                <ol className="plain-list">
                  {data.top.map((p) => (
                    <li key={p._id}><a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">{p.title}</a><small>{p.views.toLocaleString('en-IN')} views</small></li>
                  ))}
                </ol>
              )}
              <p className="muted small">{data.categories} categories, {data.tags} tags, {data.authors} authors</p>
            </section>
          </div>
        </>
      )}
    </>
  );
}
