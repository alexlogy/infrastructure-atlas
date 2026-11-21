import type { Media, SiteSetting, TimelineMilestone } from '@/payload-types'
import { isSafeHref } from '@/lib/validation/links'
import type { DatePrecision, ImageView, MilestoneView, SiteSettingsView } from '@/types/view-models'

export const DEFAULT_SITE_TITLE = 'Infrastructure Atlas'

const PRECISIONS: readonly DatePrecision[] = ['year', 'month', 'day']

const clean = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function toSiteSettingsView(doc: Partial<SiteSetting> | null | undefined): SiteSettingsView {
  return {
    siteTitle: clean(doc?.siteTitle) ?? DEFAULT_SITE_TITLE,
    description: clean(doc?.description),
    locale: clean(doc?.locale) ?? 'en',
    // Re-validate on the way out: stored data may predate the field validator.
    navLinks: (doc?.navLinks ?? [])
      .filter((link) => clean(link.label) && isSafeHref(link.href ?? ''))
      .map((link) => ({ label: link.label.trim(), href: link.href.trim() })),
    showJourney: doc?.sections?.journey ?? true,
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
    tags: (doc.tags ?? []).map((t) => t.trim()).filter(Boolean),
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
