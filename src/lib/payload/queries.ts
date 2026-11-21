import type { Payload, Where } from 'payload'

import type { User } from '@/payload-types'

import { isValidSlug } from '@/lib/validation/slugs'
import type {
  AtlasView,
  HomePageView,
  MilestoneView,
  ProjectSummaryView,
  ProjectView,
  SiteSettingsView,
  WritingSettingsView,
} from '@/types/view-models'

import {
  compareMilestones,
  toAtlasView,
  compareProjects,
  toHomePageView,
  toMilestoneView,
  toProjectSummaryView,
  toProjectView,
  toSiteSettingsView,
  toWritingSettingsView,
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

/**
 * Read mode for draft-enabled collections. Anonymous: published only. With a
 * preview user (an authenticated editor): latest drafts, still access-checked
 * as that user rather than with overrideAccess.
 */
function readMode(previewUser?: User | null) {
  return previewUser
    ? { draft: true, user: previewUser, overrideAccess: false, published: [] as Where[] }
    : { draft: false, overrideAccess: false, published: [{ _status: { equals: 'published' } }] }
}

export async function fetchSiteSettings(payload: Payload): Promise<SiteSettingsView> {
  const doc = await payload.findGlobal({
    slug: 'site-settings',
    depth: 1,
    overrideAccess: false,
    populate: PUBLIC_MEDIA,
    select: {
      siteTitle: true,
      shareImage: true,
      description: true,
      locale: true,
      navLinks: true,
      sections: true,
      atlasCenter: true,
    },
  })
  return toSiteSettingsView(doc)
}

/** Published milestones (or drafts for a preview user), with just the fields the timeline renders. */
export async function fetchPublicTimeline(
  payload: Payload,
  previewUser?: User | null,
): Promise<MilestoneView[]> {
  const { published, ...mode } = readMode(previewUser)
  const { docs } = await payload.find({
    collection: 'timeline-milestones',
    ...mode,
    where: { and: published },
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
  // Drafts may be saved without required fields; skip ones that cannot be rendered.
  return docs
    .filter((doc) => doc.title && doc.startDate)
    .map(toMilestoneView)
    .sort(compareMilestones)
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

/** One published project (or its draft, for a preview user) by slug, or null. Relationships are not selected. */
export async function fetchPublicProject(
  payload: Payload,
  slug: string,
  previewUser?: User | null,
): Promise<ProjectView | null> {
  if (!isValidSlug(slug)) return null
  const { published, ...mode } = readMode(previewUser)
  const { docs } = await payload.find({
    collection: 'impact-projects',
    ...mode,
    where: { and: [{ slug: { equals: slug } }, ...published] },
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
  const doc = docs[0]
  return doc?.title ? toProjectView({ ...doc, summary: doc.summary ?? '' }) : null
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

const ATLAS_LIMIT = 500

/** Published locations joined with the published projects and milestones that reference them. */
export async function fetchAtlas(payload: Payload): Promise<AtlasView> {
  const published = { _status: { equals: 'published' } } as const
  const common = { draft: false, overrideAccess: false, depth: 0, pagination: false } as const
  const [locations, projects, milestones] = await Promise.all([
    payload.find({
      collection: 'atlas-locations',
      ...common,
      where: published,
      limit: ATLAS_LIMIT,
      select: {
        label: true,
        city: true,
        region: true,
        country: true,
        latitude: true,
        longitude: true,
        precision: true,
        category: true,
        sortOrder: true,
      },
    }),
    payload.find({
      collection: 'impact-projects',
      ...common,
      where: { and: [published, { locations: { exists: true } }] },
      limit: PROJECTS_LIMIT,
      select: { title: true, slug: true, locations: true },
    }),
    payload.find({
      collection: 'timeline-milestones',
      ...common,
      where: { and: [published, { location: { exists: true } }] },
      limit: TIMELINE_LIMIT,
      sort: ['startDate', 'sortOrder'],
      select: { title: true, location: true },
    }),
  ])
  return toAtlasView(locations.docs, projects.docs, milestones.docs)
}

export async function fetchWritingSettings(payload: Payload): Promise<WritingSettingsView> {
  const doc = await payload.findGlobal({
    slug: 'writing-settings',
    depth: 0,
    overrideAccess: false,
    select: {
      enabled: true,
      recentCount: true,
      includeTags: true,
      excludeTags: true,
      featuredSlugs: true,
    },
  })
  return toWritingSettingsView(doc)
}
