import Image from 'next/image'
import Link from 'next/link'

import type { ProjectSummaryView } from '@/types/view-models'

export function ProjectCard({ project }: { project: ProjectSummaryView }) {
  const headingId = `project-${project.id}`

  return (
    <article
      aria-labelledby={headingId}
      className={`reveal relative flex h-full flex-col rounded-lg border bg-surface p-6 focus-within:ring-2 focus-within:ring-accent ${
        project.featured ? 'border-gold' : 'border-line'
      }`}
    >
      {project.image && (
        <Image
          src={project.image.url}
          alt={project.image.alt}
          width={project.image.width ?? 1200}
          height={project.image.height ?? 675}
          sizes="(min-width: 768px) 480px, 100vw"
          className="mb-4 h-auto w-full rounded-md"
        />
      )}
      <h2 id={headingId} className="text-xl font-semibold text-ink">
        {/* The stretched link makes the whole card clickable while keeping one tab stop. */}
        <Link
          href={`/impact/${project.slug}`}
          className="after:absolute after:inset-0 hover:text-accent focus:outline-none"
        >
          {project.title}
        </Link>
      </h2>
      <p className="mt-2 leading-relaxed text-muted">{project.summary}</p>
      {project.tags.length > 0 && (
        <ul aria-label="Tags" className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-line px-3 py-0.5 text-xs text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function ProjectGrid({ projects }: { projects: ProjectSummaryView[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  )
}
