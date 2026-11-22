import Image from 'next/image'

import { SmartLink } from '@/components/layout/SmartLink'
import type { LabStatus } from '@/lib/lab'
import { stagger } from '@/lib/motion'
import type { LabProjectView } from '@/types/view-models'

const STATUS: Record<LabStatus, { label: string; dot: string }> = {
  active: { label: 'Active', dot: 'bg-success' },
  exploring: { label: 'Exploring', dot: 'bg-accent' },
  paused: { label: 'Paused', dot: 'bg-muted' },
  archived: { label: 'Archived', dot: 'bg-subtle' },
}

/** Status in text with a coloured dot, so it never relies on colour alone. */
export function LabStatusBadge({ status }: { status: LabStatus }) {
  const { label, dot } = STATUS[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

export function LabTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <ul aria-label="Tags" className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag} className="rounded-full border border-line px-3 py-0.5 text-xs text-muted">
          {tag}
        </li>
      ))}
    </ul>
  )
}

export function LabCard({
  project,
  heading: H = 'h3',
}: {
  project: LabProjectView
  heading?: 'h2' | 'h3'
}) {
  return (
    <article
      aria-labelledby={`lab-${project.id}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface"
    >
      {project.image && (
        <Image
          src={project.image.url}
          alt={project.image.alt}
          width={project.image.width ?? 1200}
          height={project.image.height ?? 675}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-video w-full border-b border-line object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          {project.category ? (
            <p className="text-xs font-medium tracking-wide text-accent uppercase">
              {project.category}
            </p>
          ) : (
            <span />
          )}
          <LabStatusBadge status={project.status} />
        </div>
        <H id={`lab-${project.id}`} className="mt-2 font-display text-xl font-semibold text-ink">
          {project.title}
        </H>
        <p className="mt-2 flex-1 leading-relaxed text-muted">{project.summary}</p>
        <div className="mt-4">
          <LabTags tags={project.tags} />
        </div>
        {project.link && (
          <SmartLink
            href={project.link.href}
            className="mt-4 inline-flex text-sm font-medium text-accent underline-offset-4 hover:text-ink hover:underline"
          >
            {project.link.label} →
          </SmartLink>
        )}
      </div>
    </article>
  )
}

export function LabGrid({
  projects,
  heading,
}: {
  projects: LabProjectView[]
  heading?: 'h2' | 'h3'
}) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p, i) => (
        <li key={p.id} className="enter-on-scroll" style={stagger(i % 3)}>
          <LabCard project={p} heading={heading} />
        </li>
      ))}
    </ul>
  )
}
