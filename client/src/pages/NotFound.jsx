import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';

export default function NotFound({ message = 'The page you are looking for does not exist or has moved.' }) {
  return (
    <div className="container not-found">
      <Seo title="Page not found" noindex />
      <h1>We could not find that page</h1>
      <p>{message}</p>
      <p>
        <Link className="btn btn--primary" to="/blog">Browse all articles</Link>
      </p>
    </div>
  );
}
