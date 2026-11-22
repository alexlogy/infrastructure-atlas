import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProjectGrid } from '@/components/impact/ProjectCard'
import { ImpactSection } from '@/components/impact/ImpactSection'
import { pageMetadata } from '@/lib/metadata'
import { getAtlas, getHomePage, getPublicProjects, getSiteSettings } from '@/lib/payload/public'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Impact',
    description: 'Selected projects: the problem, the decisions and the outcomes.',
    path: '/impact',
  })
}

type Props = { searchParams: Promise<{ project?: string | string[]; view?: string | string[] }> }

export default async function ImpactPage({ searchParams }: Props) {
  const settings = await getSiteSettings()
  if (!settings.showImpact) notFound()

  const [projects, home, atlas] = await Promise.all([
    getPublicProjects(),
    getHomePage(),
    settings.showAtlas ? getAtlas() : null,
  ])

  return (
    <section className="container-page section-y" aria-labelledby="impact-heading">
      <h1 id="impact-heading" className="text-page font-semibold">
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
          <>
            <ImpactSection
              projects={projects}
              chosenIds={home.featuredProjectIds}
              query={await searchParams}
              basePath="/impact"
              atlas={atlas}
              heading="h2"
            />
            <section aria-labelledby="all-projects-heading" className="mt-20">
              <h2 id="all-projects-heading" className="text-section font-semibold">
                All projects
              </h2>
              <div className="mt-8">
                <ProjectGrid projects={projects} headingLevel="h3" />
              </div>
            </section>
          </>
        )}
      </div>
    </section>
  )
}
