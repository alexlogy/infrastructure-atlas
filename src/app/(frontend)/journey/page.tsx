import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { JourneyScene } from '@/components/journey/JourneyScene'
import { Timeline } from '@/components/journey/Timeline'
import { pageMetadata } from '@/lib/metadata'
import { getTimeline } from '@/lib/payload/preview'
import { getPublicProjects, getSiteSettings } from '@/lib/payload/public'

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

  const [milestones, projects] = await Promise.all([
    getTimeline(),
    settings.showImpact ? getPublicProjects() : [],
  ])
  // In preview the browser fetches images itself, with the editor's session: the optimiser fetches
  // anonymously and so can't load media that only a draft uses.
  const preview = (await draftMode()).isEnabled

  return (
    <>
      <section className="container-page section-y" aria-labelledby="journey-heading">
        <p className="eyebrow">Career journey</p>
        <h1 id="journey-heading" className="mt-3 text-page font-semibold">
          Journey
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          The climb so far, milestone by milestone. Choose a point on the trail to read its story.
        </p>
        {milestones.length > 0 && (
          <div className="mt-10">
            <JourneyScene
              milestones={milestones}
              projects={projects}
              locale={settings.locale}
              unoptimizedImages={preview}
              showEras
              deepLinks
            />
          </div>
        )}
      </section>

      <section className="container-page pb-24" aria-labelledby="chronology-heading">
        <h2 id="chronology-heading" className="text-section font-semibold">
          Chronology
        </h2>
        <p className="mt-2 text-muted">Every milestone as plain text, oldest first.</p>
        <div className="mt-10 max-w-3xl">
          <Timeline
            milestones={milestones}
            locale={settings.locale}
            unoptimizedImages={preview}
            headingLevel="h3"
          />
        </div>
      </section>
    </>
  )
}
