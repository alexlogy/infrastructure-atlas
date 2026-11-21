import type { MetadataRoute } from 'next'

import { siteOrigin } from '@/lib/seo'

export const dynamic = 'force-dynamic'

/** Public pages are crawlable; the admin, APIs and preview routes are not. */
export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin()
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  }
}
