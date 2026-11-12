import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './components/PublicLayout.jsx';
import Home from './pages/Home.jsx';
import BlogList from './pages/BlogList.jsx';
import PostPage from './pages/PostPage.jsx';
import NotFound from './pages/NotFound.jsx';

// The admin panel (and its rich-text editor) is only downloaded when someone opens /admin
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Schedule scrolling after the route commit and cancel stale work on rapid navigation.
    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/:slug" element={<PostPage />} />
          <Route path="category/:slug" element={<BlogList />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route
          path="admin/*"
          element={
            <Suspense fallback={<div className="page-loading">Loading admin…</div>}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}
