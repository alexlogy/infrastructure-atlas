import { type NextRequest, NextResponse } from 'next/server'

import { buildCsp, toCspOrigins } from '@/lib/csp'

// Computed once per server process from configuration, not per request.
const imageOrigins = toCspOrigins([process.env.GHOST_URL, process.env.CSP_IMG_ORIGINS])
const upgradeInsecure = (process.env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('https://')

/**
 * Adds a per-request nonce CSP to every rendered page (public and /admin).
 * Next.js reads the nonce from the request header and applies it to its own
 * scripts; all pages are dynamically rendered, which nonces require.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === 'development',
    imageOrigins,
    upgradeInsecure,
  })

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    {
      // API responses, static assets and image optimisation don't render HTML.
      source: '/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
