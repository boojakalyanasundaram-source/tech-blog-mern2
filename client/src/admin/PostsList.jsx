import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import Pagination from '../components/Pagination.jsx';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './Toast.jsx';
import { formatDateTime } from '../utils';

const TABS = [
  ['', 'All'],
  ['published', 'Published'],
  ['scheduled', 'Scheduled'],
  ['draft', 'Drafts'],
];

export default function PostsList() {
  const { isStaff } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const q = params.get('q') || '';
  const page = Math.max(parseInt(params.get('page'), 10) || 1, 1);

  const [data, setData] = useState(null);
  const [search, setSearch] = useState(q);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page, limit: 12 });
    if (status) qs.set('status', status);
    if (q) qs.set('q', q);
    api.get(`/admin/posts?${qs}`).then(setData).catch((e) => setError(e.message));
  }, [page, status, q]);

  useEffect(load, [load]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const run = async (fn, message) => {
    try {
      await fn();
      toast(message);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = (post) => {
    if (window.confirm(`Delete “${post.title}”? This cannot be undone.`)) {
      run(() => api.del(`/admin/posts/${post._id}`), 'Article deleted');
    }
  };

  return (
    <>
      <div className="admin__head">
        <h1>Articles</h1>
        <Link className="btn btn--primary" to="/admin/posts/new">New article</Link>
      </div>

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {TABS.map(([value, label]) => (
            <button key={label} role="tab" aria-selected={status === value} className={status === value ? 'is-active' : ''} onClick={() => update({ status: value })}>
              {label}{data && value ? ` (${data.counts[value]})` : ''}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); update({ q: search.trim() }); }}>
          <input type="search" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search articles" />
        </form>
      </div>

      {error && <p className="notice notice--error">{error}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Status</th><th>Date</th><th>Views</th>{isStaff && <th>Featured</th>}<th><span className="sr-only">Actions</span></th></tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p._id}>
                <td>
                  <Link to={`/admin/posts/${p._id}`} className="table__title">{p.title}</Link>
                  <small>{p.category?.name || 'No category'}{p.author ? `, by ${p.author.name}` : ''}</small>
                </td>
                <td><span className={`badge badge--${p.status}`}>{p.status}</span></td>
                <td>{p.status === 'scheduled' ? 'Goes live ' : ''}{formatDateTime(p.publishedAt || p.updatedAt)}</td>
                <td>{p.views}</td>
                {isStaff && (
                  <td>
                    <button
                      className={`star${p.isFeatured ? ' is-on' : ''}`}
                      aria-pressed={p.isFeatured}
                      aria-label={p.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                      onClick={() => run(() => api.patch(`/admin/posts/${p._id}/feature`, { isFeatured: !p.isFeatured }), p.isFeatured ? 'Removed from featured' : 'Marked as featured')}
                    >
                      ★
                    </button>
                  </td>
                )}
                <td className="table__actions">
                  <Link to={`/admin/posts/${p._id}`}>Edit</Link>
                  {p.status === 'published' && <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">View</a>}
                  {isStaff && p.status !== 'published' && (
                    <button onClick={() => run(() => api.patch(`/admin/posts/${p._id}/status`, { status: 'published' }), 'Published')}>Publish</button>
                  )}
                  {isStaff && p.status === 'published' && (
                    <button onClick={() => run(() => api.patch(`/admin/posts/${p._id}/status`, { status: 'draft' }), 'Moved to drafts')}>Unpublish</button>
                  )}
                  {isStaff && <button className="danger" onClick={() => remove(p)}>Delete</button>}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan="6" className="muted center">No articles found. <Link to="/admin/posts/new">Write one</Link>.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => update({ page: n > 1 ? String(n) : '' })} />}
    </>
  );
}
