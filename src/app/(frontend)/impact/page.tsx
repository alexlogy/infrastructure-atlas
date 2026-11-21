import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProjectGrid } from '@/components/impact/ProjectCard'
import { pageMetadata } from '@/lib/metadata'
import { getPublicProjects, getSiteSettings } from '@/lib/payload/public'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Impact',
    description: 'Selected projects: the problem, the decisions and the outcomes.',
    path: '/impact',
  })
}

export default async function ImpactPage() {
  const settings = await getSiteSettings()
  if (!settings.showImpact) notFound()

  const projects = await getPublicProjects()

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24" aria-labelledby="impact-heading">
      <h1 id="impact-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Impact
      </h1>
      <p className="mt-3 text-muted">
        Selected projects: the problem, the decisions and the outcomes.
      </p>
      <div className="mt-12">
        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-8 text-muted">
            <p>No projects have been published yet.</p>
            <p className="mt-2 text-sm">
              Editors can add and publish projects in the content admin.
            </p>
          </div>
        ) : (
          <ProjectGrid projects={projects} />
        )}
      </div>
    </section>
  )
}
