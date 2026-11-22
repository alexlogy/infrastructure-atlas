import type { MilestoneView } from '@/types/view-models'

import { MilestoneCard } from './MilestoneCard'

export function Timeline({
  milestones,
  locale,
  unoptimizedImages = false,
  headingLevel = 'h2',
}: {
  milestones: MilestoneView[]
  locale: string
  unoptimizedImages?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  if (milestones.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line p-8 text-muted">
        <p>No milestones have been published yet.</p>
        <p className="mt-2 text-sm">Editors can add and publish milestones in the content admin.</p>
      </div>
    )
  }

  return (
    <ol aria-label="Chronology" className="relative space-y-8 border-l border-line pl-6 sm:pl-8">
      {milestones.map((milestone) => (
        <li key={milestone.id} className="relative">
          <span
            aria-hidden="true"
            className={`absolute -left-[31px] top-7 h-3 w-3 rounded-full ring-4 ring-midnight sm:-left-[39px] ${
              milestone.featured ? 'bg-gold' : 'bg-accent'
            }`}
          />
          <MilestoneCard
            milestone={milestone}
            locale={locale}
            unoptimizedImages={unoptimizedImages}
            headingLevel={headingLevel}
          />
        </li>
      ))}
    </ol>
  )
}
