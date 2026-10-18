/**
 * Sanitizer for Office Order HTML content to prevent Stored XSS attacks
 * while preserving legitimate document formatting (bold, italic, underline,
 * table structures, span styles, Bengali text, etc.).
 */

const ALLOWED_TAGS = new Set([
  'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup',
  'p', 'br', 'hr', 'div', 'span',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'ul', 'ol', 'li', 'blockquote', 'cite', 'small', 'big',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  '*': new Set(['class', 'id', 'style', 'title', 'align', 'valign', 'dir', 'lang']),
  'table': new Set(['border', 'cellpadding', 'cellspacing', 'width', 'style', 'class']),
  'th': new Set(['colspan', 'rowspan', 'width', 'align', 'valign', 'style', 'class']),
  'td': new Set(['colspan', 'rowspan', 'width', 'align', 'valign', 'style', 'class']),
  'col': new Set(['span', 'width']),
  'colgroup': new Set(['span', 'width']),
};

/**
 * Clean inline CSS style attribute by removing executable expressions and protocols.
 */
function sanitizeStyle(style: string): string {
  // Disallow css expressions, behaviors, and javascript/vbscript URLs
  if (/expression\s*\(|behavior\s*:|javascript\s*:|vbscript\s*:/i.test(style)) {
    return '';
  }
  return style.trim();
}

/**
 * Sanitize an HTML string for safe rendering in Office Orders.
 */
export function sanitizeOrderHtml(dirty: string | null | undefined): string {
  if (!dirty || typeof dirty !== 'string') return '';

  // 1. Strip script tags and their contents entirely
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Strip style tags and their contents entirely
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 3. Strip iframe, object, embed, form, meta, link, applet tags and contents
  clean = clean.replace(/<(iframe|object|embed|applet|form|meta|link|base)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');
  clean = clean.replace(/<\/?(iframe|object|embed|applet|form|meta|link|base)\b[^>]*>/gi, '');

  // 4. Parse and filter tags & attributes using a regex tag scanner
  clean = clean.replace(/<\/?([a-zA-Z0-9]+)(\s+[^>]*)?\/?>/g, (match, tagName, rawAttrs) => {
    const lowerTag = tagName.toLowerCase();

    // If tag is not in the whitelist, drop the tag wrapper
    if (!ALLOWED_TAGS.has(lowerTag)) {
      return '';
    }

    const isClosing = match.startsWith('</');
    if (isClosing) {
      return `</${lowerTag}>`;
    }

    if (!rawAttrs || !rawAttrs.trim()) {
      return `<${lowerTag}>`;
    }

    // Extract attributes: name="value" or name='value' or name=value
    const safeAttrs: string[] = [];
    const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

      // Immediately reject any on* event handler (e.g. onload, onerror, onclick)
      if (attrName.startsWith('on')) {
        continue;
      }

      // Check if attribute is allowed on this tag or globally
      const tagAllowed = ALLOWED_ATTRIBUTES[lowerTag]?.has(attrName);
      const globalAllowed = ALLOWED_ATTRIBUTES['*']?.has(attrName);

      if (!tagAllowed && !globalAllowed) {
        continue;
      }

      // Check protocol injection in attributes
      if (/^\s*(javascript|vbscript|data):/i.test(attrValue)) {
        continue;
      }

      if (attrName === 'style') {
        const cleanStyle = sanitizeStyle(attrValue);
        if (cleanStyle) {
          safeAttrs.push(`style="${cleanStyle.replace(/"/g, '&quot;')}"`);
        }
      } else {
        safeAttrs.push(`${attrName}="${attrValue.replace(/"/g, '&quot;')}"`);
      }
    }

    const selfClosing = match.endsWith('/>') ? ' /' : '';
    return safeAttrs.length > 0 
      ? `<${lowerTag} ${safeAttrs.join(' ')}${selfClosing}>` 
      : `<${lowerTag}${selfClosing}>`;
  });

  return clean;
}
