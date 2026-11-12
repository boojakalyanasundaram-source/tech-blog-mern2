export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const items = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i += 1) items.push(i);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      {start > 1 && <span aria-hidden="true">…</span>}
      {items.map((n) => (
        <button key={n} className={n === page ? 'is-active' : ''} aria-current={n === page ? 'page' : undefined} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
      {end < pages && <span aria-hidden="true">…</span>}
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  );
}
