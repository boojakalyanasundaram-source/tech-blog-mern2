import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SearchBox({ className = '', placeholder = 'Search articles' }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get('q') || '');

  const submit = (e) => {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/blog?q=${encodeURIComponent(q)}` : '/blog');
  };

  return (
    <form className={`search ${className}`} role="search" onSubmit={submit}>
      <label className="sr-only" htmlFor={`search-${className || 'main'}`}>Search articles</label>
      <input
        id={`search-${className || 'main'}`}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={100}
      />
      <button type="submit" aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}
