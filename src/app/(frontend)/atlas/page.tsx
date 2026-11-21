import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AtlasExplorer } from '@/components/atlas/AtlasExplorer'
import { getAtlas, getSiteSettings } from '@/lib/payload/public'

export const metadata: Metadata = {
  title: 'Atlas',
  description: 'Places, and the projects and milestones connected to them.',
}

export default async function AtlasPage() {
  const settings = await getSiteSettings()
  if (!settings.showAtlas) notFound()

  const atlas = await getAtlas()

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24" aria-labelledby="atlas-heading">
      <h1 id="atlas-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Atlas
      </h1>
      <p className="mt-3 text-muted">Places, and the projects and milestones connected to them.</p>
      <div className="mt-12">
        {atlas.nodes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-8 text-muted">
            <p>No places have been published yet.</p>
            <p className="mt-2 text-sm">
              Editors can add and publish atlas locations in the content admin.
            </p>
          </div>
        ) : (
          <AtlasExplorer atlas={atlas} center={settings.atlasCenter} />
        )}
      </div>
    </section>
  )
}
