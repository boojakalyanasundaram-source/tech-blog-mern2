import slugify from 'slugify';
import sanitizeHtml from 'sanitize-html';

export const makeSlug = (text = '') => slugify(String(text), { lower: true, strict: true, trim: true });

export function stripHtml(html = '') {
  const spaced = html.replace(/<\/(p|h[1-6]|li|div|tr|td|th|blockquote|pre)>/gi, ' $&');
  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function readingTime(text = '') {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Generates a unique slug for any model that has a `slug` field.
export async function uniqueSlug(Model, input, excludeId) {
  const base = makeSlug(input) || 'item';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

// Adds ids to h2/h3 headings and returns a table of contents.
export function addHeadingIds(html = '') {
  const used = new Map();
  const toc = [];
  let i = 0;
  const out = html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (match, level, attrs = '', inner) => {
    const text = stripHtml(inner);
    if (!text) return match;
    i += 1;
    let id = makeSlug(text) || `section-${i}`;
    const seen = used.get(id) || 0;
    used.set(id, seen + 1);
    if (seen) id = `${id}-${seen + 1}`;
    toc.push({ id, text, level: Number(level) });
    const cleaned = (attrs || '').replace(/\sid="[^"]*"/i, '');
    return `<h${level}${cleaned} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, toc };
}
