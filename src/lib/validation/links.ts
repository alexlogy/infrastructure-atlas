/**
 * Accepts site-relative paths ("/journey", "#section") and absolute http(s)/mailto URLs.
 * Rejects javascript:, data: and protocol-relative ("//host") URLs.
 */
export function isSafeHref(value: string): boolean {
  const href = value.trim()
  if (!href) return false
  if (href.startsWith('#')) return true
  if (href.startsWith('/')) return !href.startsWith('//')
  try {
    const url = new URL(href)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol)
  } catch {
    return false
  }
}
