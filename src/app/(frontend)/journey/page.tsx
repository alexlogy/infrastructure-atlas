import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { Timeline } from '@/components/journey/Timeline'
import { pageMetadata } from '@/lib/metadata'
import { getTimeline } from '@/lib/payload/preview'
import { getSiteSettings } from '@/lib/payload/public'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Journey',
    description: 'Milestones along the way, in chronological order.',
    path: '/journey',
  })
}

export default async function JourneyPage() {
  const settings = await getSiteSettings()
  if (!settings.showJourney) notFound()

  const milestones = await getTimeline()
  // In preview the browser fetches images itself, with the editor's session: the optimiser fetches
  // anonymously and so can't load media that only a draft uses.
  const preview = (await draftMode()).isEnabled

  return (
    <section className="container-page section-y" aria-labelledby="journey-heading">
      <h1 id="journey-heading" className="text-page font-semibold">
        Journey
      </h1>
      <p className="mt-3 text-muted">Milestones in chronological order.</p>
      <div className="mt-12">
        <Timeline milestones={milestones} locale={settings.locale} unoptimizedImages={preview} />
      </div>
    </section>
  )
}
