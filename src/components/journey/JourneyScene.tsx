import Link from 'next/link'

import { formatDateRange } from '@/lib/dates'
import type { MilestoneView, ProjectSummaryView } from '@/types/view-models'

import { MilestoneCard } from './MilestoneCard'
import { MountainJourney } from './MountainJourney'

/**
 * Server half of the mountain timeline: formats each stop and renders every milestone's detail
 * panel (rich text stays on the server), then hands them to the interactive scene.
 */
export function JourneyScene({
  milestones,
  projects,
  locale,
  unoptimizedImages = false,
  showEras = false,
  deepLinks = false,
}: {
  milestones: MilestoneView[]
  projects: ProjectSummaryView[]
  locale: string
  unoptimizedImages?: boolean
  showEras?: boolean
  deepLinks?: boolean
}) {
  const stops = milestones.map((m) => ({
    id: m.id,
    title: m.title,
    dateLabel: formatDateRange(m.startDate, null, 'year', locale),
    era: m.era,
  }))

  const details = Object.fromEntries(
    milestones.map((m) => {
      const related = projects.filter((p) => p.milestoneIds.includes(m.id))
      return [
        m.id,
        <div key={m.id} className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <MilestoneCard
            milestone={m}
            locale={locale}
            unoptimizedImages={unoptimizedImages}
            idPrefix="milestone-detail-"
            headingLevel="h3"
          />
          {related.length > 0 && (
            <aside
              aria-label="Related projects"
              className="rounded-2xl border border-line bg-surface/60 p-6"
            >
              <p className="eyebrow">Related impact</p>
              <ul className="mt-4 space-y-3">
                {related.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/impact/${p.slug}`}
                      className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline"
                    >
                      {p.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>,
      ]
    }),
  )

  return (
    <MountainJourney stops={stops} details={details} showEras={showEras} deepLinks={deepLinks} />
  )
}
