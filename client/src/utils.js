export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';

// uploaded images have a 640px thumbnail next to the full-size file
export const thumbOf = (url = '') =>
  /^\/uploads\/.+\.webp$/.test(url) && !url.endsWith('-640.webp') ? url.replace(/\.webp$/, '-640.webp') : url;

export const srcSetOf = (url = '') => (thumbOf(url) !== url ? `${thumbOf(url)} 640w, ${url} 1600w` : undefined);

export const slugify = (text = '') =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const hueFrom = (text = '') => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

// <input type="datetime-local"> works in local time
export const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : '');
