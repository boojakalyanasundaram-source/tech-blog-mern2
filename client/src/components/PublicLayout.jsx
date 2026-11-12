import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import SearchBox from './SearchBox.jsx';
import { useCategories } from '../hooks/useFetch';
import { site } from '../config';

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="site-header">
      <div className="container site-header__row">
        <Logo />
        <button className="menu-toggle" aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen(!open)}>
          <span className="sr-only">Menu</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        <div id="primary-nav" className={`site-header__nav${open ? ' is-open' : ''}`}>
          <nav aria-label="Primary">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/blog" end>All articles</NavLink>
          </nav>
          <SearchBox className="search--header" />
        </div>
      </div>
    </header>
  );
}

function CategoryBar() {
  const categories = useCategories();
  if (!categories.length) return null;
  return (
    <nav className="category-bar" aria-label="Topics">
      <div className="container category-bar__row">
        {categories.map((c) => (
          <NavLink key={c._id} to={`/category/${c.slug}`}>{c.name}</NavLink>
        ))}
      </div>
    </nav>
  );
}

function Footer() {
  const categories = useCategories();
  const { company, social } = site;
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <h2 className="footer-title">{site.name}</h2>
          <p>{site.description}</p>
          <address>
            <strong>{company.legalName}</strong><br />
            {company.address}<br />
            <a href={`mailto:${company.email}`}>{company.email}</a><br />
            <a href={`tel:${company.phone.replace(/\s/g, '')}`}>{company.phone}</a>
          </address>
        </div>
        <div>
          <h2 className="footer-title">Topics</h2>
          <ul>
            {categories.map((c) => (
              <li key={c._id}><NavLink to={`/category/${c.slug}`}>{c.name}</NavLink></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="footer-title">Useful links</h2>
          <ul>
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/blog">All articles</NavLink></li>
            <li><a href="/sitemap.xml">Sitemap</a></li>
            <li><NavLink to="/admin">Team sign in</NavLink></li>
          </ul>
        </div>
        <div>
          <h2 className="footer-title">Follow us</h2>
          <ul>
            {social.map((s) => (
              <li key={s.label}><a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="site-footer__bottom">
        <div className="container">&copy; {new Date().getFullYear()} {company.legalName}. All rights reserved.</div>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  const { pathname, search } = useLocation();

  // Google Analytics (GA4): the tag itself is injected by the server when GA_MEASUREMENT_ID is set
  useEffect(() => {
    if (typeof window.gtag === 'function') window.gtag('event', 'page_view', { page_path: pathname + search, page_title: document.title });
  }, [pathname, search]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <CategoryBar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
