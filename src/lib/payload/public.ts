import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { CACHE_TAGS } from '@/lib/cache/tags'
import type { MilestoneView, SiteSettingsView } from '@/types/view-models'

import { toSiteSettingsView } from './mappers'
import { fetchPublicTimeline, fetchSiteSettings } from './queries'

/**
 * Site settings for public rendering. Falls back to neutral defaults if the
 * CMS is unreachable so the shell (navigation, skip link) still renders.
 */
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettingsView> => {
    try {
      return await fetchSiteSettings(await getPayload({ config }))
    } catch {
      console.error('[site-settings] failed to load; using defaults')
      return toSiteSettingsView(null)
    }
  },
  ['public-site-settings'],
  { tags: [CACHE_TAGS.siteSettings] },
)

/** Published timeline, cached until a publish/unpublish expires the `timeline` tag. */
export const getPublicTimeline = unstable_cache(
  async (): Promise<MilestoneView[]> => fetchPublicTimeline(await getPayload({ config })),
  ['public-timeline'],
  { tags: [CACHE_TAGS.timeline] },
)
