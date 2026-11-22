import type {
  AboutPage,
  Achievement,
  AtlasLocation,
  HomePage,
  ImpactProject,
  Media,
  SiteSetting,
  TimelineMilestone,
  WritingSetting,
} from '@/payload-types'
import { PROJECT_ICONS } from '@/lib/project-icons'
import { isSafeHref } from '@/lib/validation/links'
import type {
  AboutPageView,
  AchievementView,
  AtlasNodeView,
  AtlasView,
  DatePrecision,
  LatLng,
  HomePageView,
  ImageView,
  MilestoneView,
  NavLink,
  ProjectSummaryView,
  ProjectView,
  SiteSettingsView,
  WritingSettingsView,
} from '@/types/view-models'

export const DEFAULT_SITE_TITLE = 'Infrastructure Atlas'

/** Neutral Asia-Pacific framing used until an editor sets a starting view. */
export const DEFAULT_ATLAS_CENTER: LatLng = { latitude: 5, longitude: 115 }

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
    contact:
      toLinks([{ label: doc?.contact?.label || 'Get in touch', href: doc?.contact?.href }])[0] ??
      null,
    showJourney: doc?.sections?.journey ?? true,
    showImpact: doc?.sections?.impact ?? true,
    showAtlas: doc?.sections?.atlas ?? true,
    shareImage: toImageView(doc?.shareImage),
    atlasCenter: {
      latitude: doc?.atlasCenter?.latitude ?? DEFAULT_ATLAS_CENTER.latitude,
      longitude: doc?.atlasCenter?.longitude ?? DEFAULT_ATLAS_CENTER.longitude,
    },
  }
}

const LOCAL_MEDIA_PATH = '/api/media/file/'

/**
 * Payload prefixes file URLs with serverURL; next/image's localPatterns need the
 * site-relative path (metadata resolves it against metadataBase).
 */
function toLocalMediaUrl(url: string): string {
  const { pathname } = new URL(url, 'http://relative.invalid')
  return pathname.startsWith(LOCAL_MEDIA_PATH) ? pathname : url
}

export function toImageView(media: number | Media | null | undefined): ImageView | null {
  // An unpopulated id or a file without a URL cannot be rendered.
  if (!media || typeof media !== 'object' || !media.url) return null
  return {
    url: toLocalMediaUrl(media.url),
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
> &
  Partial<Pick<PublicProjectDoc, 'category' | 'icon'>> &
  Partial<Pick<ImpactProject, 'milestones' | 'locations'>>

/** Relationship values arrive as ids or populated docs depending on depth. */
const relIds = (rels: (number | { id: number } | null)[] | null | undefined): string[] =>
  (rels ?? []).flatMap((r) => (r == null ? [] : [String(typeof r === 'object' ? r.id : r)]))

export function toProjectSummaryView(doc: PublicProjectSummaryDoc): ProjectSummaryView {
  return {
    id: String(doc.id),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    category: clean(doc.category),
    icon: doc.icon && PROJECT_ICONS.includes(doc.icon) ? doc.icon : null,
    image: toImageView(doc.featuredImage),
    tags: cleanTags(doc.tags),
    featured: Boolean(doc.featured),
    sortOrder: doc.sortOrder ?? 0,
    milestoneIds: relIds(doc.milestones),
    locationIds: relIds(doc.locations),
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
    eyebrow: clean(doc?.eyebrow),
    headline: clean(doc?.headline),
    headlineEmphasis: clean(doc?.headlineEmphasis),
    subheadline: clean(doc?.subheadline),
    heroImage: toImageView(doc?.heroImage),
    callsToAction: toLinks(doc?.callsToAction),
    featuredProjectIds: (doc?.featuredProjects ?? []).map((p) =>
      String(typeof p === 'object' ? p.id : p),
    ),
  }
}

export type PublicLocationDoc = Pick<
  AtlasLocation,
  | 'id'
  | 'label'
  | 'city'
  | 'region'
  | 'country'
  | 'latitude'
  | 'longitude'
  | 'precision'
  | 'category'
  | 'sortOrder'
>
export type AtlasProjectDoc = Pick<ImpactProject, 'id' | 'title' | 'slug'> & {
  locations?: (number | { id: number })[] | null
}
export type AtlasMilestoneDoc = Pick<TimelineMilestone, 'id' | 'title'> & {
  location?: number | { id: number } | null
}

const refId = (ref: number | { id: number } | null | undefined): string | null =>
  ref == null ? null : String(typeof ref === 'object' ? ref.id : ref)

/**
 * Joins published locations with the published projects and milestones that
 * reference them. All three inputs must already be published-only: anything
 * pointing at a location missing from `locations` is dropped.
 */
export function toAtlasView(
  locations: PublicLocationDoc[],
  projects: AtlasProjectDoc[],
  milestones: AtlasMilestoneDoc[],
): AtlasView {
  const nodes = new Map<string, AtlasNodeView>()
  for (const loc of [...locations].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.label.localeCompare(b.label),
  )) {
    if (!Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude)) continue
    const place = [loc.city, loc.region, loc.country].map(clean).filter(Boolean).join(', ')
    nodes.set(String(loc.id), {
      id: String(loc.id),
      label: loc.label,
      place: place || null,
      latitude: loc.latitude,
      longitude: loc.longitude,
      precision: loc.precision ?? 'city',
      category: clean(loc.category),
      stories: [],
    })
  }

  const arcs = new Map<string, { from: string; to: string }>()
  for (const project of projects) {
    const ids = [...new Set((project.locations ?? []).map(refId))].filter(
      (id): id is string => id !== null && nodes.has(id),
    )
    for (const id of ids) {
      nodes.get(id)!.stories.push({
        kind: 'project',
        title: project.title,
        href: `/impact/${project.slug}`,
      })
    }
    for (let i = 1; i < ids.length; i++) {
      const [from, to] = [ids[i - 1], ids[i]].sort()
      arcs.set(`${from}:${to}`, { from, to })
    }
  }

  for (const milestone of milestones) {
    const id = refId(milestone.location)
    if (id && nodes.has(id)) {
      nodes.get(id)!.stories.push({
        kind: 'milestone',
        title: milestone.title,
        href: `/journey#milestone-${milestone.id}`,
      })
    }
  }

  return { nodes: [...nodes.values()], arcs: [...arcs.values()] }
}

export function toWritingSettingsView(
  doc: Partial<WritingSetting> | null | undefined,
): WritingSettingsView {
  const count = doc?.recentCount ?? 6
  return {
    enabled: doc?.enabled ?? true,
    recentCount: Number.isInteger(count) ? Math.min(Math.max(count, 1), 20) : 6,
    includeTags: cleanTags(doc?.includeTags),
    excludeTags: cleanTags(doc?.excludeTags),
    featuredSlugs: cleanTags(doc?.featuredSlugs),
  }
}

export type PublicAchievementDoc = Pick<
  Achievement,
  'id' | 'value' | 'unit' | 'label' | 'explanation' | 'icon'
>

export function toAchievementView(doc: PublicAchievementDoc): AchievementView | null {
  const value = clean(doc.value)
  const label = clean(doc.label)
  if (!value || !label) return null
  return {
    id: String(doc.id),
    value,
    unit: clean(doc.unit),
    label,
    explanation: clean(doc.explanation),
    icon: doc.icon && PROJECT_ICONS.includes(doc.icon) ? doc.icon : null,
  }
}

export function toAboutPageView(doc: Partial<AboutPage> | null | undefined): AboutPageView {
  const statement = clean(doc?.statement)
  const introduction = doc?.introduction ?? null
  const principles = (doc?.principles ?? []).flatMap((p) => {
    const title = clean(p.title)
    return title ? [{ title, body: clean(p.body) }] : []
  })
  return {
    statement,
    introduction,
    portrait: toImageView(doc?.portrait),
    principles,
    currentFocus: clean(doc?.currentFocus),
    credentials: (doc?.credentials ?? []).flatMap((c) => {
      const title = clean(c.title)
      const url = clean(c.url)
      return title
        ? [
            {
              title,
              issuer: clean(c.issuer),
              issuedOn: c.issuedOn ?? null,
              expiresOn: c.expiresOn ?? null,
              url: url && isSafeHref(url) ? url : null,
            },
          ]
        : []
    }),
    contact: {
      heading: clean(doc?.contact?.heading),
      text: clean(doc?.contact?.text),
      links: toLinks(doc?.contact?.links),
    },
    hasContent: Boolean(statement || introduction || principles.length > 0),
  }
}
