import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizer for Office Order HTML content to prevent Stored XSS attacks
 * while preserving legitimate document formatting (bold, italic, underline,
 * table structures, span styles, Bengali text, etc.).
 */

const ALLOWED_TAGS = [
  'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup',
  'p', 'br', 'hr', 'div', 'span',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'col', 'colgroup',
  'ul', 'ol', 'li', 'blockquote', 'cite', 'small', 'big',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
];

const ALLOWED_ATTR = [
  'class', 'id', 'style', 'title', 'align', 'valign', 'dir', 'lang',
  'border', 'cellpadding', 'cellspacing', 'width', 'colspan', 'rowspan', 'span'
];

// Hook to clean style attributes against expressions, behaviors, and javascript: urls
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.hasAttribute('style')) {
    const style = node.getAttribute('style') || '';
    if (/expression\s*\(|behavior\s*:|javascript\s*:|vbscript\s*:|url\s*\(/i.test(style)) {
      node.removeAttribute('style');
    }
  }
});

/**
 * Sanitize an HTML string for safe rendering in Office Orders.
 */
export function sanitizeOrderHtml(dirty: string | null | undefined): string {
  if (!dirty || typeof dirty !== 'string') return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: { html: true, svg: false, mathMl: false },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'applet', 'form', 'meta', 'link', 'base', 'svg', 'math', 'img'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'src', 'href']
  });
}
