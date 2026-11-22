import type { MetadataRoute } from 'next'

import type { ProjectSummaryView, SiteSettingsView } from '@/types/view-models'

/** Public origin for absolute URLs, without a trailing slash. */
export function siteOrigin(value = process.env.NEXT_PUBLIC_SITE_URL): string {
  return (value || 'http://localhost:3000').replace(/\/+$/, '')
}

/**
 * Sitemap of public, enabled sections and published projects only. Callers
 * must pass published-only data (getPublicProjects), never preview results.
 */
export function sitemapEntries(
  origin: string,
  input: {
    settings: Pick<SiteSettingsView, 'showJourney' | 'showImpact' | 'showAtlas'>
    projects: Pick<ProjectSummaryView, 'slug'>[]
    showWriting: boolean
    showAbout?: boolean
  },
): MetadataRoute.Sitemap {
  const { settings, projects, showWriting, showAbout = false } = input
  const paths = [
    '/',
    ...(settings.showJourney ? ['/journey'] : []),
    ...(settings.showImpact
      ? ['/impact', ...projects.map((p) => `/impact/${encodeURIComponent(p.slug)}`)]
      : []),
    ...(settings.showAtlas ? ['/atlas'] : []),
    ...(showAbout ? ['/about'] : []),
    ...(showWriting ? ['/writing'] : []),
  ]
  return paths.map((path) => ({ url: `${origin}${path}` }))
}
