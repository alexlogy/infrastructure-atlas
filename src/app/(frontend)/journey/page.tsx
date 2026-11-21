import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Timeline } from '@/components/journey/Timeline'
import { getPublicTimeline, getSiteSettings } from '@/lib/payload/public'

export const metadata: Metadata = {
  title: 'Journey',
  description: 'Milestones along the way, in chronological order.',
}

export default async function JourneyPage() {
  const settings = await getSiteSettings()
  if (!settings.showJourney) notFound()

  const milestones = await getPublicTimeline()

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 sm:py-24" aria-labelledby="journey-heading">
      <h1 id="journey-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Journey
      </h1>
      <p className="mt-3 text-muted">Milestones in chronological order.</p>
      <div className="mt-12">
        <Timeline milestones={milestones} locale={settings.locale} />
      </div>
    </section>
  )
}
