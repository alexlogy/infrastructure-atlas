import type { Payload } from 'payload'

import type { MilestoneView, SiteSettingsView } from '@/types/view-models'

import { compareMilestones, toMilestoneView, toSiteSettingsView } from './mappers'

// Hard ceiling on the public timeline size per request.
const TIMELINE_LIMIT = 500

/**
 * Public queries, uncached and framework-free so they can be integration-tested.
 * Every query runs as an anonymous reader: `overrideAccess: false` with no user
 * makes Payload enforce the collection's public read rules.
 */

export async function fetchSiteSettings(payload: Payload): Promise<SiteSettingsView> {
  const doc = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: false,
    select: { siteTitle: true, description: true, locale: true, navLinks: true, sections: true },
  })
  return toSiteSettingsView(doc)
}

/** Published milestones only, with just the fields the timeline renders. */
export async function fetchPublicTimeline(payload: Payload): Promise<MilestoneView[]> {
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
}
