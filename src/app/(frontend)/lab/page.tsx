import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TagFilter } from '@/components/TagFilter'
import { LabGrid } from '@/components/lab/LabCard'
import { LabFeature } from '@/components/lab/LabFeature'
import { labTags, leadLabProject } from '@/lib/lab'
import { pickTag } from '@/lib/tags'
import { pageMetadata } from '@/lib/metadata'
import { getPublicLabProjects } from '@/lib/payload/public'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Lab',
    description: 'Experiments, prototypes and tools, built to keep learning.',
    path: '/lab',
  })
}

type Props = { searchParams: Promise<{ tag?: string | string[] }> }

export default async function LabPage({ searchParams }: Props) {
  const projects = await getPublicLabProjects()
  if (projects.length === 0) notFound()

  const tags = labTags(projects)
  const tag = pickTag(tags, (await searchParams).tag)
  const lead = tag ? null : leadLabProject(projects)
  const rest = tag
    ? projects.filter((p) => p.tags.includes(tag))
    : projects.filter((p) => p !== lead)

  return (
    <section className="container-page section-y" aria-labelledby="lab-heading">
      <p className="eyebrow">Engineering Lab</p>
      <h1 id="lab-heading" className="mt-3 text-page font-semibold">
        Lab
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Experiments, prototypes and tools, built to keep learning.
      </p>

      {lead && (
        <div className="mt-12">
          <LabFeature project={lead} />
        </div>
      )}

      <div className="mt-12">
        <TagFilter basePath="/lab" tags={tags} active={tag} />
      </div>

      {rest.length > 0 && (
        <div className="mt-8">
          <LabGrid projects={rest} heading="h2" />
        </div>
      )}
    </section>
  )
}
