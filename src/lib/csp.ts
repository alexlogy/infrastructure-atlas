/**
 * Content Security Policy for every rendered page (public site and admin).
 *
 * Scripts are strict: only scripts carrying this request's nonce run, plus
 * what they load ('strict-dynamic'). Styles allow inline because next/image,
 * the WebGL canvas and the Payload admin set style attributes a nonce cannot
 * cover; injected CSS is far less dangerous than injected script.
 */
export function buildCsp({
  nonce,
  isDev,
  imageOrigins,
  upgradeInsecure,
}: {
  nonce: string
  isDev: boolean
  /** Extra image origins (Ghost, CDN), already validated. */
  imageOrigins: string[]
  upgradeInsecure: boolean
}): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // 'unsafe-eval' only in development: React uses eval for dev-time error overlays.
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', ...imageOrigins],
    'font-src': ["'self'"],
    // Dev needs the HMR websocket.
    'connect-src': ["'self'", ...(isDev ? ['ws:'] : [])],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
  }
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`)
  if (upgradeInsecure) policy.push('upgrade-insecure-requests')
  return policy.join('; ')
}

/**
 * Turns configured URLs into CSP origins ("https://host[:port]"). Anything that
 * is not a plain http(s) URL is dropped rather than widening the policy.
 */
export function toCspOrigins(values: (string | undefined)[]): string[] {
  const origins = new Set<string>()
  for (const raw of values.flatMap((v) => (v ?? '').split(/[\s,]+/)).filter(Boolean)) {
    try {
      const url = new URL(raw)
      if (url.protocol === 'https:' || url.protocol === 'http:') origins.add(url.origin)
    } catch {
      // ignore invalid entries
    }
  }
  return [...origins]
}
