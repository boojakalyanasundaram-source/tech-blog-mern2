import { Link } from 'react-router-dom';
import { site } from '../config';

export default function Logo({ light }) {
  return (
    <Link to="/" className={`logo${light ? ' logo--light' : ''}`} aria-label={`${site.name} home`}>
      <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill={light ? '#ffffff' : '#0f2a47'} />
        <path d="M8 34h13l6-16 10 30 7-14h12" fill="none" stroke="#ff5a4f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{site.name}</span>
    </Link>
  );
}
