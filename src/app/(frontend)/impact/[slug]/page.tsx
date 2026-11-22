import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Metadata } from 'next'
import Image from 'next/image'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PerspectiveSwitch, perspectiveLabel } from '@/components/impact/PerspectiveSwitch'
import { PROSE_CLASS, RichText } from '@/components/RichText'
import { pageMetadata } from '@/lib/metadata'
import { getProject } from '@/lib/payload/preview'
import { getPublicProject, getSiteSettings } from '@/lib/payload/public'
import { selectPerspective } from '@/lib/perspective'
import type { ImageView } from '@/types/view-models'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ view?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getPublicProject((await params).slug)
  if (!project) return {}
  return pageMetadata({
    title: project.title,
    description: project.summary,
    path: `/impact/${project.slug}`,
    image: project.image,
  })
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const settings = await getSiteSettings()
  if (!settings.showImpact) notFound()

  const project = await getProject((await params).slug)
  if (!project) notFound()
  // In preview the browser fetches images itself, with the editor's session: the optimiser fetches
  // anonymously and so can't load media that only a draft uses.
  const unoptimized = (await draftMode()).isEnabled

  const narratives = {
    leadership: project.leadershipNarrative,
    engineering: project.engineeringNarrative,
  }
  const perspective = selectPerspective((await searchParams).view, {
    leadership: Boolean(narratives.leadership),
    engineering: Boolean(narratives.engineering),
  })

  return (
    <article className="container-page section-y [&>*]:max-w-3xl" aria-labelledby="project-heading">
      <p className="text-sm">
        <Link
          href="/impact"
          className="text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          ← All projects
        </Link>
      </p>
      <h1 id="project-heading" className="mt-4 text-page font-semibold">
        {project.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{project.summary}</p>
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
      {project.image && (
        <Figure image={project.image} className="mt-8" priority unoptimized={unoptimized} />
      )}

      {perspective && (
        <section aria-labelledby="perspective-heading" className="mt-12">
          {narratives.leadership && narratives.engineering && (
            <PerspectiveSwitch
              active={perspective}
              hrefFor={(view) => `/impact/${project.slug}?view=${view}`}
            />
          )}
          <h2 id="perspective-heading" className="mt-6 text-section font-semibold">
            {perspectiveLabel(perspective)} perspective
          </h2>
          <RichText
            data={narratives[perspective] as SerializedEditorState}
            className={`mt-4 ${PROSE_CLASS}`}
          />
        </section>
      )}

      <ProseSection title="The challenge" data={project.challenge} />
      <ProseSection title="Architecture" data={project.architecture}>
        {project.diagram && (
          <Figure image={project.diagram} className="mt-6" unoptimized={unoptimized} />
        )}
      </ProseSection>
      <ProseSection title="Decisions and trade-offs" data={project.decisions} />

      {project.outcomes.length > 0 && (
        <section aria-labelledby="outcomes-heading" className="mt-12">
          <h2 id="outcomes-heading" className="text-section font-semibold">
            Outcomes
          </h2>
          <ul className="mt-4 space-y-4">
            {project.outcomes.map((outcome, i) => (
              <li key={i} className="rounded-lg border border-line bg-surface p-5">
                {outcome.metric ? (
                  <p className="text-2xl font-semibold text-gold">
                    {outcome.metric}
                    <span className="sr-only"> (measured)</span>
                  </p>
                ) : (
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Qualitative
                  </p>
                )}
                <p className="mt-1 leading-relaxed text-ink/90">{outcome.result}</p>
                {outcome.verification && (
                  <p className="mt-2 text-sm text-muted">Source: {outcome.verification}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ProseSection title="Limitations" data={project.limitations} />

      {project.sourceLinks.length > 0 && (
        <section aria-labelledby="sources-heading" className="mt-12">
          <h2 id="sources-heading" className="text-section font-semibold">
            Sources
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            {project.sourceLinks.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <a
                  href={link.href}
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-4 hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}

function ProseSection({
  title,
  data,
  children,
}: {
  title: string
  data: SerializedEditorState | null
  children?: React.ReactNode
}) {
  if (!data && !children) return null
  const id = `${title.toLowerCase().replace(/[^a-z]+/g, '-')}-heading`
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="text-section font-semibold">
        {title}
      </h2>
      {data && <RichText data={data} className={`mt-4 ${PROSE_CLASS}`} />}
      {children}
    </section>
  )
}

function Figure({
  image,
  className,
  priority,
  unoptimized,
}: {
  image: ImageView
  className?: string
  priority?: boolean
  unoptimized: boolean
}) {
  return (
    <figure className={className}>
      <Image
        src={image.url}
        alt={image.alt}
        width={image.width ?? 1200}
        height={image.height ?? 675}
        sizes="(min-width: 768px) 720px, 100vw"
        priority={priority}
        unoptimized={unoptimized}
        className="h-auto w-full rounded-md"
      />
      {image.attribution && (
        <figcaption className="mt-2 text-xs text-muted">{image.attribution}</figcaption>
      )}
    </figure>
  )
}
