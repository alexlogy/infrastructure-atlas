import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { LabGrid } from '@/components/lab/LabCard'
import { LabFeature } from '@/components/lab/LabFeature'
import { labTags, leadLabProject, pickLabTag } from '@/lib/lab'
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
  const tag = pickLabTag(tags, (await searchParams).tag)
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

      {tags.length > 1 && (
        <nav aria-label="Filter by tag" className="mt-12">
          <ul className="flex flex-wrap gap-2">
            {[null, ...tags].map((t) => (
              <li key={t ?? 'all'}>
                <Link
                  href={t ? `/lab?tag=${encodeURIComponent(t)}` : '/lab'}
                  scroll={false}
                  aria-current={t === tag ? 'true' : undefined}
                  className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm text-muted transition-colors duration-150 hover:border-accent hover:text-ink aria-[current=true]:border-accent aria-[current=true]:bg-accent/10 aria-[current=true]:text-ink"
                >
                  {t ?? 'All'}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {rest.length > 0 && (
        <div className="mt-8">
          <LabGrid projects={rest} heading="h2" />
        </div>
      )}
    </section>
  )
}
