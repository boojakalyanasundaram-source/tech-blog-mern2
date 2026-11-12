import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import Editor from './Editor.jsx';
import ImageField from './ImageField.jsx';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './Toast.jsx';
import { fromLocalInput, slugify, toLocalInput } from '../utils';
import { site } from '../config';

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '', featuredImage: '', featuredImageAlt: '',
  category: '', tags: [], author: '', status: 'draft', publishedAt: '', isFeatured: false,
  seoTitle: '', metaDescription: '',
};

function Counter({ value, max }) {
  const over = value.length > max;
  return <small className={`counter${over ? ' is-over' : ''}`}>{value.length}/{max}</small>;
}

export default function PostEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const { isStaff } = useAuth();

  const [form, setForm] = useState(EMPTY);
  const [initialContent, setInitialContent] = useState('');
  const [ready, setReady] = useState(isNew);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [opts, setOpts] = useState({ categories: [], tags: [], authors: [] });
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    Promise.all([api.get('/admin/categories'), api.get('/admin/tags'), api.get('/admin/authors')])
      .then(([categories, tags, authors]) => setOpts({ categories, tags, authors }))
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  useEffect(() => {
    if (isNew) return;
    api.get(`/admin/posts/${id}`)
      .then((p) => {
        setOriginal(p);
        setInitialContent(p.content);
        setForm({
          ...EMPTY, ...p,
          category: p.category || '', author: p.author || '', tags: p.tags || [],
          publishedAt: toLocalInput(p.publishedAt),
        });
        setReady(true);
      })
      .catch((e) => { toast(e.message, 'error'); navigate('/admin/posts'); });
  }, [id, isNew, navigate, toast]);

  const onTitle = (title) => set({ title, ...(slugTouched ? {} : { slug: slugify(title) }) });

  const toggleTag = (tagId) =>
    set({ tags: form.tags.includes(tagId) ? form.tags.filter((t) => t !== tagId) : [...form.tags, tagId] });

  const addTag = async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const name = newTag.trim();
    if (!name) return;
    try {
      const tag = await api.post('/admin/tags', { name });
      setOpts((o) => ({ ...o, tags: [...o.tags, tag] }));
      set({ tags: [...form.tags, tag._id] });
      setNewTag('');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        category: form.category || null,
        author: form.author || null,
        publishedAt: fromLocalInput(form.publishedAt),
      };
      const saved = isNew ? await api.post('/admin/posts', body) : await api.put(`/admin/posts/${id}`, body);
      toast(form.status === 'published' ? 'Article published' : form.status === 'scheduled' ? 'Article scheduled' : 'Draft saved');
      if (isNew) navigate(`/admin/posts/${saved._id}`, { replace: true });
      else setOriginal(saved);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveLabel = useMemo(() => {
    if (saving) return 'Saving…';
    if (form.status === 'scheduled') return 'Schedule article';
    if (form.status === 'published') return original?.status === 'published' ? 'Update article' : 'Publish article';
    return 'Save draft';
  }, [saving, form.status, original]);

  if (!ready) return <p className="muted">Loading article…</p>;

  const previewTitle = (form.seoTitle || form.title || 'Article title').slice(0, 70);
  const previewDesc = (form.metaDescription || form.excerpt || 'The description shown in search results appears here.').slice(0, 160);

  return (
    <form onSubmit={save} className="editor-page">
      <div className="admin__head">
        <div>
          <Link to="/admin/posts" className="back-link">All articles</Link>
          <h1>{isNew ? 'New article' : 'Edit article'}</h1>
        </div>
        <div className="admin__head-actions">
          {original?.status === 'published' && <a className="btn btn--outline" href={`/blog/${original.slug}`} target="_blank" rel="noreferrer">View live</a>}
          <button className="btn btn--primary" disabled={saving}>{saveLabel}</button>
        </div>
      </div>

      <div className="editor-grid">
        <div className="editor-main">
          <label className="field">
            <span className="sr-only">Title</span>
            <input className="title-input" placeholder="Article title" required maxLength={200} value={form.title} onChange={(e) => onTitle(e.target.value)} />
          </label>
          <label className="field slug-field">
            <span>URL slug</span>
            <div className="slug-input">
              <em>{site.url}/blog/</em>
              <input value={form.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} placeholder="generated-from-title" />
            </div>
          </label>
          <Editor initialContent={initialContent} onChange={(content) => set({ content })} />
          <label className="field">
            <span>Short description <Counter value={form.excerpt} max={300} /></span>
            <textarea rows="3" maxLength={300} value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} placeholder="Shown on cards and listings. Leave empty to use the start of the article." />
          </label>
        </div>

        <div className="editor-side">
          <section className="card">
            <h2>Publishing</h2>
            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={(e) => set({ status: e.target.value })} disabled={!isStaff}>
                <option value="draft">Draft</option>
                {isStaff && <option value="scheduled">Scheduled</option>}
                {isStaff && <option value="published">Published</option>}
              </select>
            </label>
            {!isStaff && <p className="muted small">Authors save drafts. An editor reviews and publishes them.</p>}
            {form.status === 'scheduled' && (
              <label className="field">
                <span>Publish on</span>
                <input type="datetime-local" required value={form.publishedAt} onChange={(e) => set({ publishedAt: e.target.value })} />
              </label>
            )}
            {isStaff && (
              <label className="check">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => set({ isFeatured: e.target.checked })} />
                Show in featured articles
              </label>
            )}
          </section>

          <section className="card">
            <h2>Featured image</h2>
            <ImageField value={form.featuredImage} onChange={(featuredImage) => set({ featuredImage })} label="Featured image" />
            {form.featuredImage && (
              <label className="field">
                <span>Alt text</span>
                <input value={form.featuredImageAlt} maxLength={200} onChange={(e) => set({ featuredImageAlt: e.target.value })} placeholder="Describe the image" />
              </label>
            )}
          </section>

          <section className="card">
            <h2>Organise</h2>
            <label className="field">
              <span>Category</span>
              <select value={form.category} onChange={(e) => set({ category: e.target.value })}>
                <option value="">Select a category</option>
                {opts.categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Author</span>
              <select value={form.author} onChange={(e) => set({ author: e.target.value })}>
                <option value="">Select an author</option>
                {opts.authors.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </label>
            <fieldset className="field">
              <legend>Tags</legend>
              <div className="chips">
                {opts.tags.map((t) => (
                  <label key={t._id} className={`chip${form.tags.includes(t._id) ? ' is-on' : ''}`}>
                    <input type="checkbox" checked={form.tags.includes(t._id)} onChange={() => toggleTag(t._id)} />
                    {t.name}
                  </label>
                ))}
              </div>
              {isStaff && <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={addTag} placeholder="Add a new tag and press Enter" />}
            </fieldset>
          </section>

          <section className="card">
            <h2>Search engine listing</h2>
            <label className="field">
              <span>SEO title <Counter value={form.seoTitle} max={70} /></span>
              <input value={form.seoTitle} maxLength={70} onChange={(e) => set({ seoTitle: e.target.value })} placeholder="Defaults to the article title" />
            </label>
            <label className="field">
              <span>Meta description <Counter value={form.metaDescription} max={170} /></span>
              <textarea rows="3" value={form.metaDescription} maxLength={170} onChange={(e) => set({ metaDescription: e.target.value })} placeholder="Defaults to the short description" />
            </label>
            <div className="serp" aria-label="Search result preview">
              <span className="serp__url">{site.url}/blog/{form.slug || 'article-slug'}</span>
              <span className="serp__title">{previewTitle}</span>
              <span className="serp__desc">{previewDesc}</span>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
