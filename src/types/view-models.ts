import type { LabStatus } from '@/lib/lab'
import type { ProjectIconName } from '@/lib/project-icons'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/** Public, minimal shapes handed to React components. Never pass raw CMS documents. */

export type NavLink = { label: string; href: string }

export type SiteSettingsView = {
  siteTitle: string
  description: string | null
  locale: string
  navLinks: NavLink[]
  /** Header/footer contact button; null until an editor sets a link. */
  contact: NavLink | null
  showJourney: boolean
  showImpact: boolean
  showAtlas: boolean
  atlasCenter: LatLng
  shareImage: ImageView | null
}

export type LatLng = { latitude: number; longitude: number }

export type DatePrecision = 'year' | 'month' | 'day'

export type ImageView = {
  url: string
  alt: string
  width: number | null
  height: number | null
  attribution: string | null
}

export type MilestoneView = {
  id: string
  title: string
  subtitle: string | null
  startDate: string
  endDate: string | null
  datePrecision: DatePrecision
  description: SerializedEditorState | null
  era: string | null
  tags: string[]
  image: ImageView | null
  featured: boolean
  sortOrder: number
}

export type OutcomeView = {
  result: string
  /** Present only for measured outcomes; absent means qualitative. */
  metric: string | null
  verification: string | null
}

export type ProjectSummaryView = {
  id: string
  slug: string
  title: string
  summary: string
  /** Short tile label, e.g. "Platform"; null when not set. */
  category: string | null
  icon: ProjectIconName | null
  image: ImageView | null
  tags: string[]
  featured: boolean
  sortOrder: number
  /** Related records in the editor's order; may include unpublished ids, so intersect before display. */
  milestoneIds: string[]
  locationIds: string[]
}

export type ProjectView = ProjectSummaryView & {
  leadershipNarrative: SerializedEditorState | null
  engineeringNarrative: SerializedEditorState | null
  challenge: SerializedEditorState | null
  architecture: SerializedEditorState | null
  diagram: ImageView | null
  decisions: SerializedEditorState | null
  outcomes: OutcomeView[]
  limitations: SerializedEditorState | null
  sourceLinks: NavLink[]
}

export type HomePageView = {
  eyebrow: string | null
  headline: string | null
  /** Optional second headline line, shown in the accent colour. */
  headlineEmphasis: string | null
  subheadline: string | null
  heroImage: ImageView | null
  callsToAction: NavLink[]
  /** Ordered ids; resolved against published projects at render time. */
  featuredProjectIds: string[]
}

export type CredentialView = {
  title: string
  issuer: string | null
  issuedOn: string | null
  /** Null when the credential does not expire. */
  expiresOn: string | null
  url: string | null
}

export type AboutPageView = {
  statement: string | null
  introduction: SerializedEditorState | null
  portrait: ImageView | null
  principles: { title: string; body: string | null }[]
  currentFocus: string | null
  credentials: CredentialView[]
  contact: { heading: string | null; text: string | null; links: NavLink[] }
  /** True once there is something to show on /about (statement, introduction or a principle). */
  hasContent: boolean
}

export type LabProjectView = {
  id: string
  title: string
  category: string | null
  status: LabStatus
  summary: string
  tags: string[]
  image: ImageView | null
  link: NavLink | null
  featured: boolean
}

/** One figure in the home page metric strip; entered by an editor, never computed. */
export type AchievementView = {
  id: string
  value: string
  unit: string | null
  label: string
  explanation: string | null
  icon: ProjectIconName | null
}

export type AtlasStoryView = { kind: 'project' | 'milestone'; title: string; href: string }

export type AtlasNodeView = LatLng & {
  id: string
  label: string
  /** "City, Region, Country" from whichever parts are filled in. */
  place: string | null
  precision: 'exact' | 'city' | 'region' | 'country'
  category: string | null
  stories: AtlasStoryView[]
}

/** A connection between two nodes, derived from a project's ordered locations. */
export type AtlasArcView = { from: string; to: string }

export type AtlasView = { nodes: AtlasNodeView[]; arcs: AtlasArcView[] }

/** A Ghost post as shown on a card. `url` is the canonical article URL. */
export type GhostPostView = {
  id: string
  title: string
  slug: string
  url: string
  excerpt: string | null
  image: { url: string; alt: string } | null
  tags: string[]
  publishedAt: string
  readingTime: number | null
}

export type WritingSettingsView = {
  enabled: boolean
  recentCount: number
  includeTags: string[]
  excludeTags: string[]
  featuredSlugs: string[]
}
