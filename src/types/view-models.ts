import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/** Public, minimal shapes handed to React components. Never pass raw CMS documents. */

export type NavLink = { label: string; href: string }

export type SiteSettingsView = {
  siteTitle: string
  description: string | null
  locale: string
  navLinks: NavLink[]
  showJourney: boolean
}

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
