import type { Payload } from 'payload'

import { isValidSlug } from '@/lib/validation/slugs'
import type {
  HomePageView,
  MilestoneView,
  ProjectSummaryView,
  ProjectView,
  SiteSettingsView,
} from '@/types/view-models'

import {
  compareMilestones,
  compareProjects,
  toHomePageView,
  toMilestoneView,
  toProjectSummaryView,
  toProjectView,
  toSiteSettingsView,
} from './mappers'

// Hard ceilings on public list sizes per request.
const TIMELINE_LIMIT = 500
const PROJECTS_LIMIT = 200

const PUBLIC_MEDIA = {
  media: { url: true, alt: true, width: true, height: true, attribution: true },
} as const

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
    populate: PUBLIC_MEDIA,
  })
  return docs.map(toMilestoneView).sort(compareMilestones)
}

const PROJECT_SUMMARY_SELECT = {
  slug: true,
  title: true,
  summary: true,
  featuredImage: true,
  tags: true,
  featured: true,
  sortOrder: true,
} as const

/** Published projects for listings, summary fields only. */
export async function fetchPublicProjects(payload: Payload): Promise<ProjectSummaryView[]> {
  const { docs } = await payload.find({
    collection: 'impact-projects',
    draft: false,
    overrideAccess: false,
    where: { _status: { equals: 'published' } },
    depth: 1,
    limit: PROJECTS_LIMIT,
    pagination: false,
    sort: ['sortOrder', 'title'],
    select: PROJECT_SUMMARY_SELECT,
    populate: PUBLIC_MEDIA,
  })
  return docs.map(toProjectSummaryView).sort(compareProjects)
}

/** One published project by slug, or null. Relationships are not selected. */
export async function fetchPublicProject(
  payload: Payload,
  slug: string,
): Promise<ProjectView | null> {
  if (!isValidSlug(slug)) return null
  const { docs } = await payload.find({
    collection: 'impact-projects',
    draft: false,
    overrideAccess: false,
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    depth: 1,
    limit: 1,
    pagination: false,
    select: {
      ...PROJECT_SUMMARY_SELECT,
      leadershipNarrative: true,
      engineeringNarrative: true,
      challenge: true,
      architecture: true,
      diagram: true,
      decisions: true,
      outcomes: true,
      limitations: true,
      sourceLinks: true,
    },
    populate: PUBLIC_MEDIA,
  })
  return docs[0] ? toProjectView(docs[0]) : null
}

export async function fetchHomePage(payload: Payload): Promise<HomePageView> {
  const doc = await payload.findGlobal({
    slug: 'home-page',
    depth: 1,
    overrideAccess: false,
    select: {
      headline: true,
      subheadline: true,
      heroImage: true,
      callsToAction: true,
      featuredProjects: true,
    },
    // Only ids are used; publication is checked against the published project list.
    populate: { ...PUBLIC_MEDIA, 'impact-projects': { slug: true } },
  })
  return toHomePageView(doc)
}
