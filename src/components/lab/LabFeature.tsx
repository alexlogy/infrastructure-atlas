import Image from 'next/image'

import { SmartLink } from '@/components/layout/SmartLink'
import type { LabProjectView } from '@/types/view-models'

import { LabStatusBadge, LabTags } from './LabCard'

/**
 * The lead Lab entry: its diagram large on a faint blueprint grid, with the write-up beside it.
 * The image's alt text is the diagram's text alternative, and the summary restates it in prose.
 */
export function LabFeature({ project }: { project: LabProjectView }) {
  return (
    <article
      aria-labelledby="lab-feature-title"
      className="overflow-hidden rounded-3xl border border-line bg-surface"
    >
      <div className={`grid ${project.image ? 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]' : ''}`}>
        {project.image && (
          <div className="relative flex items-center justify-center border-b border-line bg-deep/70 p-6 lg:border-r lg:border-b-0 lg:p-10">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(rgb(44_74_95/0.35)_1px,transparent_1px),linear-gradient(90deg,rgb(44_74_95/0.35)_1px,transparent_1px)] bg-[size:32px_32px]"
            />
            <Image
              src={project.image.url}
              alt={project.image.alt}
              width={project.image.width ?? 1600}
              height={project.image.height ?? 900}
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="relative h-auto w-full rounded-lg"
            />
          </div>
        )}
        <div className="flex flex-col justify-center p-6 lg:p-10">
          <div className="flex items-center gap-3">
            <p className="eyebrow">{project.category ?? 'Featured experiment'}</p>
            <LabStatusBadge status={project.status} />
          </div>
          <h2 id="lab-feature-title" className="mt-3 text-section font-semibold">
            {project.title}
          </h2>
          <p className="mt-4 leading-relaxed text-muted">{project.summary}</p>
          <div className="mt-6">
            <LabTags tags={project.tags} />
          </div>
          {project.link && (
            <SmartLink
              href={project.link.href}
              className="mt-6 inline-flex font-medium text-accent underline-offset-4 hover:text-ink hover:underline"
            >
              {project.link.label} →
            </SmartLink>
          )}
        </div>
      </div>
    </article>
  )
}
