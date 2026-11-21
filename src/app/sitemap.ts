import type { MetadataRoute } from 'next'

import { ghostConfig } from '@/lib/ghost'
import { getPublicProjects, getSiteSettings, getWritingSettings } from '@/lib/payload/public'
import { siteOrigin, sitemapEntries } from '@/lib/seo'

// Built from CMS data at request time (cached loaders), not at build time.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, writing] = await Promise.all([getSiteSettings(), getWritingSettings()])
  const projects = settings.showImpact ? await getPublicProjects().catch(() => []) : []
  return sitemapEntries(siteOrigin(), {
    settings,
    projects,
    showWriting: Boolean(ghostConfig) && writing.enabled,
  })
}
