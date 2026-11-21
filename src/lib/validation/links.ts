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

/**
 * Returns a same-origin path ("/impact/x?view=y") or null. Used for redirects,
 * so anything that could leave the site ("//host", "/\host", absolute URLs) is refused.
 */
export function toSafeLocalPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || /[\\\s]/.test(value)) return null
  const base = 'http://local.invalid'
  const url = new URL(value, base)
  return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : null
}
