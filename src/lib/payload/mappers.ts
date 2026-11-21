import type {
  HomePage,
  ImpactProject,
  Media,
  SiteSetting,
  TimelineMilestone,
} from '@/payload-types'
import { isSafeHref } from '@/lib/validation/links'
import type {
  DatePrecision,
  HomePageView,
  ImageView,
  MilestoneView,
  NavLink,
  ProjectSummaryView,
  ProjectView,
  SiteSettingsView,
} from '@/types/view-models'

export const DEFAULT_SITE_TITLE = 'Infrastructure Atlas'

const PRECISIONS: readonly DatePrecision[] = ['year', 'month', 'day']

const clean = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

type RawLink = { label?: string | null; href?: string | null }

/** Re-validate on the way out: stored data may predate the field validator. */
function toLinks(links: RawLink[] | null | undefined): NavLink[] {
  return (links ?? []).flatMap((link) => {
    const label = clean(link.label)
    const href = clean(link.href)
    return label && href && isSafeHref(href) ? [{ label, href }] : []
  })
}

const cleanTags = (tags: string[] | null | undefined): string[] =>
  (tags ?? []).map((t) => t.trim()).filter(Boolean)

export function toSiteSettingsView(doc: Partial<SiteSetting> | null | undefined): SiteSettingsView {
  return {
    siteTitle: clean(doc?.siteTitle) ?? DEFAULT_SITE_TITLE,
    description: clean(doc?.description),
    locale: clean(doc?.locale) ?? 'en',
    navLinks: toLinks(doc?.navLinks),
    showJourney: doc?.sections?.journey ?? true,
    showImpact: doc?.sections?.impact ?? true,
  }
}

export function toImageView(media: number | Media | null | undefined): ImageView | null {
  // An unpopulated id or a file without a URL cannot be rendered.
  if (!media || typeof media !== 'object' || !media.url) return null
  return {
    url: media.url,
    alt: media.alt ?? '',
    width: media.width ?? null,
    height: media.height ?? null,
    attribution: clean(media.attribution),
  }
}

/** The subset of a milestone document that public queries select. */
export type PublicMilestoneDoc = Omit<TimelineMilestone, 'createdAt' | 'updatedAt' | '_status'>

export function toMilestoneView(doc: PublicMilestoneDoc): MilestoneView {
  return {
    id: String(doc.id),
    title: doc.title,
    subtitle: clean(doc.subtitle),
    startDate: doc.startDate,
    endDate: doc.endDate ?? null,
    datePrecision: PRECISIONS.includes(doc.datePrecision) ? doc.datePrecision : 'month',
    description: doc.description ?? null,
    era: clean(doc.era),
    tags: cleanTags(doc.tags),
    image: toImageView(doc.image),
    featured: Boolean(doc.featured),
    sortOrder: doc.sortOrder ?? 0,
  }
}

/** Chronological (oldest first); `sortOrder` breaks ties, then title for stability. */
export function compareMilestones(a: MilestoneView, b: MilestoneView): number {
  return (
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime() ||
    a.sortOrder - b.sortOrder ||
    a.title.localeCompare(b.title)
  )
}

/** The subset of a project document that public queries select. */
export type PublicProjectDoc = Omit<
  ImpactProject,
  'createdAt' | 'updatedAt' | '_status' | 'milestones' | 'locations'
>

export type PublicProjectSummaryDoc = Pick<
  PublicProjectDoc,
  'id' | 'slug' | 'title' | 'summary' | 'featuredImage' | 'tags' | 'featured' | 'sortOrder'
>

export function toProjectSummaryView(doc: PublicProjectSummaryDoc): ProjectSummaryView {
  return {
    id: String(doc.id),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    image: toImageView(doc.featuredImage),
    tags: cleanTags(doc.tags),
    featured: Boolean(doc.featured),
    sortOrder: doc.sortOrder ?? 0,
  }
}

export function toProjectView(doc: PublicProjectDoc): ProjectView {
  return {
    ...toProjectSummaryView(doc),
    leadershipNarrative: doc.leadershipNarrative ?? null,
    engineeringNarrative: doc.engineeringNarrative ?? null,
    challenge: doc.challenge ?? null,
    architecture: doc.architecture ?? null,
    diagram: toImageView(doc.diagram),
    decisions: doc.decisions ?? null,
    outcomes: (doc.outcomes ?? []).flatMap((o) => {
      const result = clean(o.result)
      return result
        ? [{ result, metric: clean(o.metric), verification: clean(o.verification) }]
        : []
    }),
    limitations: doc.limitations ?? null,
    sourceLinks: toLinks(doc.sourceLinks?.map((l) => ({ label: l.label, href: l.url }))),
  }
}

/** Listing order: `sortOrder` (lower first), then title for stability. */
export function compareProjects(a: ProjectSummaryView, b: ProjectSummaryView): number {
  return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)
}

export function toHomePageView(doc: Partial<HomePage> | null | undefined): HomePageView {
  return {
    headline: clean(doc?.headline),
    subheadline: clean(doc?.subheadline),
    heroImage: toImageView(doc?.heroImage),
    callsToAction: toLinks(doc?.callsToAction),
    featuredProjectIds: (doc?.featuredProjects ?? []).map((p) =>
      String(typeof p === 'object' ? p.id : p),
    ),
  }
}
