import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { CACHE_TAGS } from '@/lib/cache/tags'
import type {
  AboutPageView,
  AchievementView,
  AtlasView,
  HomePageView,
  LabProjectView,
  MilestoneView,
  ProjectSummaryView,
  ProjectView,
  SiteSettingsView,
  WritingSettingsView,
} from '@/types/view-models'

import {
  toAboutPageView,
  toHomePageView,
  toSiteSettingsView,
  toWritingSettingsView,
} from './mappers'
import {
  fetchAboutPage,
  fetchAtlas,
  fetchPublicAchievements,
  fetchPublicLabProjects,
  fetchHomePage,
  fetchPublicProject,
  fetchPublicProjects,
  fetchPublicTimeline,
  fetchSiteSettings,
  fetchWritingSettings,
} from './queries'

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
  // Bump the key whenever SiteSettingsView changes shape, or stale cached entries survive deploys.
  ['public-site-settings-v4'],
  { tags: [CACHE_TAGS.siteSettings] },
)

/** Published timeline, cached until a publish/unpublish expires the `timeline` tag. */
export const getPublicTimeline = unstable_cache(
  async (): Promise<MilestoneView[]> => fetchPublicTimeline(await getPayload({ config })),
  ['public-timeline'],
  { tags: [CACHE_TAGS.timeline] },
)

/** Published project summaries, cached until a project publish/unpublish. */
export const getPublicProjects = unstable_cache(
  async (): Promise<ProjectSummaryView[]> => fetchPublicProjects(await getPayload({ config })),
  ['public-projects-v2'],
  { tags: [CACHE_TAGS.projects] },
)

/** One published project; the slug is part of the cache key. */
export const getPublicProject = unstable_cache(
  async (slug: string): Promise<ProjectView | null> =>
    fetchPublicProject(await getPayload({ config }), slug),
  ['public-project-v2'],
  { tags: [CACHE_TAGS.projects] },
)

/** Home page copy. Falls back to empty values so the homepage still renders. */
export const getHomePage = unstable_cache(
  async (): Promise<HomePageView> => {
    try {
      return await fetchHomePage(await getPayload({ config }))
    } catch {
      console.error('[home-page] failed to load; using defaults')
      return toHomePageView(null)
    }
  },
  ['public-home-page-v2'],
  { tags: [CACHE_TAGS.homePage] },
)

/** Atlas nodes and arcs. Depends on locations, projects and milestones, so any of their publishes expire it. */
export const getAtlas = unstable_cache(
  async (): Promise<AtlasView> => fetchAtlas(await getPayload({ config })),
  ['public-atlas'],
  { tags: [CACHE_TAGS.atlas, CACHE_TAGS.projects, CACHE_TAGS.timeline] },
)

/** Writing section options. Falls back to defaults so a CMS hiccup never breaks the layout. */
export const getWritingSettings = unstable_cache(
  async (): Promise<WritingSettingsView> => {
    try {
      return await fetchWritingSettings(await getPayload({ config }))
    } catch {
      console.error('[writing-settings] failed to load; using defaults')
      return toWritingSettingsView(null)
    }
  },
  ['public-writing-settings'],
  { tags: [CACHE_TAGS.writing] },
)

/** Published achievements for the home page strip, cached until one is published or unpublished. */
export const getPublicAchievements = unstable_cache(
  async (): Promise<AchievementView[]> => {
    try {
      return await fetchPublicAchievements(await getPayload({ config }))
    } catch {
      console.error('[achievements] failed to load; hiding the metric strip')
      return []
    }
  },
  ['public-achievements'],
  { tags: [CACHE_TAGS.achievements] },
)

/** About & philosophy content. Falls back to empty values so the home page still renders. */
export const getAboutPage = unstable_cache(
  async (): Promise<AboutPageView> => {
    try {
      return await fetchAboutPage(await getPayload({ config }))
    } catch {
      console.error('[about-page] failed to load; using defaults')
      return toAboutPageView(null)
    }
  },
  ['public-about-page'],
  { tags: [CACHE_TAGS.aboutPage] },
)

/** Published Lab entries, cached until one is published or unpublished. */
export const getPublicLabProjects = unstable_cache(
  async (): Promise<LabProjectView[]> => {
    try {
      return await fetchPublicLabProjects(await getPayload({ config }))
    } catch {
      console.error('[lab] failed to load; hiding the Lab')
      return []
    }
  },
  ['public-lab-projects'],
  { tags: [CACHE_TAGS.lab] },
)
