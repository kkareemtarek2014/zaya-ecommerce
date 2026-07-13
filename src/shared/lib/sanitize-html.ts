/**
 * Allow-list HTML sanitizer for product descriptions (no external deps).
 * Keeps: p, br, strong, b, em, i, ul, ol, li, a[href] (http/https/# only).
 */
export function sanitizeProductHtml(input: string): string {
  let html = input
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*style\b[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');

  // Strip disallowed tags, keep text
  html = html.replace(
    /<\/?(?!\/?(?:p|br|strong|b|em|i|ul|ol|li|a)\b)[a-z][^>]*>/gi,
    '',
  );

  // Normalize <a> tags: only href, strip other attrs
  html = html.replace(/<a\b([^>]*)>/gi, (_m, attrs: string) => {
    const hrefMatch = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const raw = hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? '';
    const href = raw.trim();
    if (
      !href ||
      (!href.startsWith('http://') &&
        !href.startsWith('https://') &&
        !href.startsWith('/') &&
        !href.startsWith('#'))
    ) {
      return '<a>';
    }
    const safe = href.replace(/"/g, '&quot;');
    return `<a href="${safe}" rel="noopener noreferrer">`;
  });

  // Self-close empty brs for consistency
  html = html.replace(/<br\s*\/?>/gi, '<br />');

  return html.trim();
}

export function prepareProductDescription(
  description: string,
  format: 'plain' | 'html',
): { description: string; descriptionFormat: 'plain' | 'html' } {
  if (format === 'html') {
    return {
      description: sanitizeProductHtml(description),
      descriptionFormat: 'html',
    };
  }
  // Strip any HTML when plain
  return {
    description: description.replace(/<[^>]+>/g, '').trim(),
    descriptionFormat: 'plain',
  };
}
