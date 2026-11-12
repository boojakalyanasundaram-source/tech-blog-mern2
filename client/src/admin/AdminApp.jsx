import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './admin.css';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { ToastProvider } from './Toast.jsx';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import PostsList from './PostsList.jsx';
import PostEditor from './PostEditor.jsx';
import { Authors, Categories, Tags, Users } from './Managers.jsx';

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loading">Checking your session…</div>;
  if (!user) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  return <Layout />;
}

function Layout() {
  const { user, logout, isStaff, isAdmin } = useAuth();
  return (
    <div className="admin">
      <Helmet><title>Admin</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <aside className="admin__side">
        <div className="admin__brand">Content studio</div>
        <nav aria-label="Admin">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/posts" end>Articles</NavLink>
          <NavLink to="/admin/posts/new">New article</NavLink>
          <NavLink to="/admin/categories">Categories</NavLink>
          <NavLink to="/admin/tags">Tags</NavLink>
          <NavLink to="/admin/authors">Authors</NavLink>
          {isAdmin && <NavLink to="/admin/users">Team &amp; roles</NavLink>}
        </nav>
        <div className="admin__user">
          <div><strong>{user.name}</strong><span>{user.role}</span></div>
          <a href="/" target="_blank" rel="noreferrer">View website</a>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="admin__main">
        <Outlet context={{ isStaff }} />
      </main>
    </div>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route index element={<Dashboard />} />
            <Route path="posts" element={<PostsList />} />
            <Route path="posts/new" element={<PostEditor />} />
            <Route path="posts/:id" element={<PostEditor />} />
            <Route path="categories" element={<Categories />} />
            <Route path="tags" element={<Tags />} />
            <Route path="authors" element={<Authors />} />
            <Route path="users" element={<Users />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
