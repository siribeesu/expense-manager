import DOMPurify from 'dompurify';

/**
 * Sanitizes user-provided text inputs, stripping out any HTML tags,
 * script payloads, or malicious XSS vectors. Works seamlessly in browser,
 * SSR, and JSDOM test environments.
 */
export function sanitizeText(dirtyText: string | undefined | null): string {
  if (!dirtyText) return '';

  try {
    const purifier: any = typeof DOMPurify === 'function' && typeof window !== 'undefined'
      ? (DOMPurify as any)(window)
      : DOMPurify;

    if (purifier && typeof purifier.sanitize === 'function') {
      const cleaned = purifier.sanitize(dirtyText, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      }).trim();
      return cleaned
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }
  } catch {
    // Fall back to robust regex tag stripping
  }

  // Robust HTML tag stripping fallback
  return dirtyText.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Sanitizes an object containing string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      result[key] = sanitizeText(value);
    }
  }
  return result as T;
}
