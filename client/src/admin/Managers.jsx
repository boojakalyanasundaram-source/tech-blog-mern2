import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import ImageField from './ImageField.jsx';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './Toast.jsx';

function ResourceManager({ title, noun, endpoint, columns, fields, canEdit, intro, defaults = {} }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, {} = new item
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get(endpoint).then(setItems).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
  }, [endpoint, toast]);
  useEffect(load, [load]);

  const open = (item) => {
    setEditing(item);
    setForm(item._id ? { ...item, password: '' } : { ...defaults });
  };
  const close = () => setEditing(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form };
      if (editing._id && !body.password) delete body.password;
      if (editing._id) await api.put(`${endpoint}/${editing._id}`, body);
      else await api.post(endpoint, body);
      toast(`${noun} saved`);
      close();
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.name}”?`)) return;
    try {
      await api.del(`${endpoint}/${item._id}`);
      toast(`${noun} deleted`);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="admin__head">
        <div>
          <h1>{title}</h1>
          {intro && <p className="muted">{intro}</p>}
        </div>
        {canEdit && <button className="btn btn--primary" onClick={() => open({})}>Add {noun.toLowerCase()}</button>}
      </div>

      <div className={`manager${editing ? ' has-form' : ''}`}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}{canEdit && <th><span className="sr-only">Actions</span></th>}</tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  {columns.map((c) => <td key={c.key}>{c.render ? c.render(item) : item[c.key]}</td>)}
                  {canEdit && (
                    <td className="table__actions">
                      <button onClick={() => open(item)}>Edit</button>
                      <button className="danger" onClick={() => remove(item)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
              {!loading && items.length === 0 && <tr><td colSpan={columns.length + 1} className="muted center">Nothing here yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {editing && (
          <form className="card manager__form" onSubmit={submit}>
            <h2>{editing._id ? `Edit ${noun.toLowerCase()}` : `Add ${noun.toLowerCase()}`}</h2>
            {fields.map((f) => {
              const required = typeof f.required === 'function' ? f.required(editing) : f.required;
              if (f.type === 'image') {
                return (
                  <div className="field" key={f.name}>
                    <span>{f.label}</span>
                    <ImageField value={form[f.name]} onChange={(v) => setForm({ ...form, [f.name]: v })} label={f.label} />
                  </div>
                );
              }
              if (f.type === 'checkbox') {
                return (
                  <label className="check" key={f.name}>
                    <input type="checkbox" checked={!!form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} />
                    {f.label}
                  </label>
                );
              }
              return (
                <label className="field" key={f.name}>
                  <span>{f.label}</span>
                  {f.type === 'textarea' ? (
                    <textarea rows="3" value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                  ) : f.type === 'select' ? (
                    <select value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                      {f.options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type || 'text'}
                      required={required}
                      autoComplete={f.type === 'password' ? 'new-password' : undefined}
                      value={form[f.name] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                    />
                  )}
                  {f.help && <small className="muted">{f.help}</small>}
                </label>
              );
            })}
            <div className="form-actions">
              <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn btn--ghost" onClick={close}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

const count = { key: 'postCount', label: 'Articles' };

export function Categories() {
  const { isStaff } = useAuth();
  return (
    <ResourceManager
      title="Categories" noun="Category" endpoint="/admin/categories" canEdit={isStaff}
      intro="Categories appear in the top navigation and on the website footer."
      defaults={{ order: 0 }}
      columns={[{ key: 'name', label: 'Name' }, { key: 'slug', label: 'URL' }, count]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'order', label: 'Display order', type: 'number', help: 'Lower numbers appear first' },
      ]}
    />
  );
}

export function Tags() {
  const { isStaff } = useAuth();
  return (
    <ResourceManager
      title="Tags" noun="Tag" endpoint="/admin/tags" canEdit={isStaff}
      intro="Tags group related articles across categories."
      columns={[{ key: 'name', label: 'Name' }, { key: 'slug', label: 'URL' }, count]}
      fields={[{ name: 'name', label: 'Name', required: true }]}
    />
  );
}

export function Authors() {
  const { isStaff } = useAuth();
  return (
    <ResourceManager
      title="Authors" noun="Author" endpoint="/admin/authors" canEdit={isStaff}
      intro="Authors are the public bylines shown on articles."
      columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, count]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'avatar', label: 'Photo', type: 'image' },
        { name: 'bio', label: 'Short bio', type: 'textarea' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'linkedin', label: 'LinkedIn address', type: 'url' },
        { name: 'twitter', label: 'X address', type: 'url' },
        { name: 'website', label: 'Website', type: 'url' },
      ]}
    />
  );
}

export function Users() {
  const { isAdmin, user } = useAuth();
  if (!isAdmin) return <p className="notice notice--error">Only administrators can manage team accounts.</p>;
  return (
    <ResourceManager
      title="Team & roles" noun="User" endpoint="/admin/users" canEdit
      intro="Admins manage everything. Editors manage content and publish. Authors write drafts."
      defaults={{ role: 'author', active: true }}
      columns={[
        { key: 'name', label: 'Name', render: (u) => (u._id === user._id ? `${u.name} (you)` : u.name) },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'active', label: 'Status', render: (u) => <span className={`badge badge--${u.active ? 'published' : 'draft'}`}>{u.active ? 'Active' : 'Inactive'}</span> },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: (item) => !item._id, help: 'At least 8 characters. Leave empty to keep the current password.' },
        { name: 'role', label: 'Role', type: 'select', options: [['author', 'Author'], ['editor', 'Editor'], ['admin', 'Admin']] },
        { name: 'active', label: 'Account is active', type: 'checkbox' },
      ]}
    />
  );
}
