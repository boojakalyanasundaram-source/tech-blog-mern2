import sanitizeHtml from 'sanitize-html';

const cellAttrs = ['colspan', 'rowspan', 'data-colwidth'];

const options = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark',
    'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'pre', 'code',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
    'iframe', 'video', 'source', 'div', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
    pre: ['class'],
    code: ['class'],
    span: ['class'],
    div: ['class', 'data-youtube-video'],
    th: cellAttrs,
    td: cellAttrs,
    iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder', 'allow', 'title'],
    video: ['src', 'controls', 'poster', 'width', 'height', 'preload'],
    source: ['src', 'type'],
  },
  allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }),
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy', decoding: 'async' } }),
  },
};

export const sanitizeContent = (html = '') => sanitizeHtml(html, options);
