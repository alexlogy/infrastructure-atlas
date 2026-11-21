import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { CACHE_TAGS } from '@/lib/cache/tags'
import type { MilestoneView, SiteSettingsView } from '@/types/view-models'

import { compareMilestones, toMilestoneView, toSiteSettingsView } from './mappers'

// Hard ceiling on the public timeline size per request.
const TIMELINE_LIMIT = 500

/**
 * Site settings for public rendering. Falls back to neutral defaults if the
 * CMS is unreachable so the shell (navigation, skip link) still renders.
 */
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettingsView> => {
    try {
      const payload = await getPayload({ config })
      const doc = await payload.findGlobal({
        slug: 'site-settings',
        depth: 0,
        overrideAccess: false,
        select: {
          siteTitle: true,
          description: true,
          locale: true,
          navLinks: true,
          sections: true,
        },
      })
      return toSiteSettingsView(doc)
    } catch {
      console.error('[site-settings] failed to load; using defaults')
      return toSiteSettingsView(null)
    }
  },
  ['public-site-settings'],
  { tags: [CACHE_TAGS.siteSettings] },
)

/**
 * Published milestones only, as anonymous-visible view models.
 * `draft: false` + `overrideAccess: false` with no user means the collection's
 * read access (published-only) is enforced; `select` limits fetched fields.
 */
export const getPublicTimeline = unstable_cache(
  async (): Promise<MilestoneView[]> => {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'timeline-milestones',
      draft: false,
      overrideAccess: false,
      where: { _status: { equals: 'published' } },
      depth: 1,
      limit: TIMELINE_LIMIT,
      pagination: false,
      sort: ['startDate', 'sortOrder'],
      select: {
        title: true,
        subtitle: true,
        startDate: true,
        endDate: true,
        datePrecision: true,
        description: true,
        era: true,
        tags: true,
        image: true,
        featured: true,
        sortOrder: true,
      },
      populate: {
        media: { url: true, alt: true, width: true, height: true, attribution: true },
      },
    })
    return docs.map(toMilestoneView).sort(compareMilestones)
  },
  ['public-timeline'],
  { tags: [CACHE_TAGS.timeline] },
)
