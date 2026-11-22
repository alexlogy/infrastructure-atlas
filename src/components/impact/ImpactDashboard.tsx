import Image from 'next/image'
import Link from 'next/link'

import type { Perspective } from '@/lib/perspective'
import { richTextExcerpt } from '@/lib/rich-text'
import type { AtlasView, ProjectSummaryView, ProjectView } from '@/types/view-models'

import { PerspectiveSwitch } from './PerspectiveSwitch'
import { ProjectIcon } from './ProjectIcon'
import { RegionalImpact } from './RegionalImpact'

type Row = { label: string; text: string | null }

/** Leadership reads Challenge → Approach → Outcome; Engineering reads Architecture → Decisions → Trade-offs. */
function rowsFor(project: ProjectView, perspective: Perspective | null): Row[] {
  const ex = (s: Parameters<typeof richTextExcerpt>[0]) => richTextExcerpt(s, 200)
  const outcome = project.outcomes[0]?.result ?? null
  const rows: Row[] =
    perspective === 'engineering'
      ? [
          {
            label: 'Architecture',
            text: ex(project.architecture) ?? ex(project.engineeringNarrative),
          },
          { label: 'Decisions', text: ex(project.decisions) },
          { label: 'Trade-offs', text: ex(project.limitations) },
        ]
      : [
          { label: 'Challenge', text: ex(project.challenge) },
          { label: 'Approach', text: ex(project.leadershipNarrative) },
          { label: 'Outcome', text: outcome },
        ]
  return rows.filter((r) => r.text)
}

/**
 * The impact band: a featured case study with the Leadership / Engineering switch (left), a stack
 * of featured-project tiles that choose which case study shows (middle) and a regional mini atlas
 * of that project's places (right). All state lives in the URL (`?project=&view=`), so it works
 * without JavaScript and every view is linkable.
 */
export function ImpactDashboard({
  projects,
  selected,
  perspective,
  basePath,
  atlas,
  heading: H = 'h3',
}: {
  /** Tiles, in display order. */
  projects: ProjectSummaryView[]
  selected: ProjectView
  perspective: Perspective | null
  /** The page the dashboard is on ("/" or "/impact"); tile and switch links stay on it. */
  basePath: string
  /** Null when the atlas is switched off. */
  atlas: AtlasView | null
  heading?: 'h2' | 'h3'
}) {
  const hrefFor = (slug: string, view: Perspective | null) =>
    `${basePath}?project=${encodeURIComponent(slug)}${view ? `&view=${view}` : ''}`
  const both = Boolean(selected.leadershipNarrative && selected.engineeringNarrative)
  const metrics = selected.outcomes.filter((o) => o.metric).slice(0, 3)

  const byId = new Map((atlas?.nodes ?? []).map((n) => [n.id, n]))
  const places = selected.locationIds.flatMap((id) => byId.get(id) ?? [])
  const arcs = places.slice(1).map((p, i) => ({ from: places[i].id, to: p.id }))
  const regional = places.length > 0

  return (
    <div
      className={`grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] ${
        regional ? 'xl:grid-cols-[minmax(0,45fr)_minmax(0,20fr)_minmax(0,35fr)]' : ''
      }`}
    >
      <article
        aria-labelledby="impact-featured-title"
        className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 lg:p-8"
      >
        <div className="flex items-center gap-3">
          <p className="eyebrow">Selected impact</p>
          <span aria-hidden="true" className="h-px w-12 bg-gold/70" />
        </div>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <H id="impact-featured-title" className="text-section font-semibold">
            {selected.title}
          </H>
          {both && perspective && (
            <PerspectiveSwitch active={perspective} hrefFor={(v) => hrefFor(selected.slug, v)} />
          )}
        </div>

        <div key={`${selected.slug}-${perspective}`} className="fade-in">
          <p className="mt-3 max-w-prose leading-relaxed text-muted">{selected.summary}</p>

          <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
            <dl className="divide-y divide-line/70 border-y border-line/70">
              {rowsFor(selected, perspective).map((row, i) => (
                <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr] sm:gap-4">
                  <dt className="text-sm font-medium text-accent">
                    <span aria-hidden="true" className="mr-2 text-subtle">
                      0{i + 1}
                    </span>
                    {row.label}
                  </dt>
                  <dd className="text-sm leading-relaxed text-ink/90">{row.text}</dd>
                </div>
              ))}
            </dl>
            {selected.image && (
              <Image
                src={selected.image.url}
                alt={selected.image.alt}
                width={selected.image.width ?? 640}
                height={selected.image.height ?? 480}
                sizes="(min-width: 640px) 10rem, 100vw"
                className="h-auto w-full rounded-lg border border-line object-cover sm:w-40 sm:self-end"
              />
            )}
          </div>

          {metrics.length > 0 && (
            <ul aria-label="Measured outcomes" className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
              {metrics.map((m) => (
                <li key={m.result}>
                  <p className="font-display text-2xl font-semibold text-gold">{m.metric}</p>
                  <p className="mt-1 max-w-[16rem] text-xs text-muted">{m.result}</p>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={`/impact/${selected.slug}${perspective ? `?view=${perspective}` : ''}`}
            className="mt-6 inline-flex font-medium text-accent underline-offset-4 hover:text-ink hover:underline"
          >
            Read the full case study →
          </Link>
        </div>
      </article>

      <nav aria-label="Featured projects">
        <ul className="grid gap-3">
          {projects.map((p) => {
            const active = p.id === selected.id
            return (
              <li key={p.id}>
                <Link
                  href={hrefFor(p.slug, perspective)}
                  scroll={false}
                  replace
                  aria-current={active ? 'true' : undefined}
                  className={`group flex gap-4 rounded-2xl border p-5 transition-colors duration-150 ${
                    active
                      ? 'border-accent/70 bg-raised shadow-lg'
                      : 'border-line bg-surface/60 hover:border-accent/50 hover:bg-surface'
                  }`}
                >
                  <span className={active ? 'text-accent' : 'text-gold'}>
                    <ProjectIcon name={p.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    {p.category && (
                      <span className="block text-xs font-medium tracking-wide text-muted uppercase">
                        {p.category}
                      </span>
                    )}
                    <span className="mt-0.5 block font-medium text-ink">{p.title}</span>
                    <span className="mt-1 line-clamp-2 text-sm text-muted">{p.summary}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="self-center text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent"
                  >
                    →
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {regional && (
        <section
          aria-labelledby="impact-regional-heading"
          className="rounded-2xl border border-line bg-surface/60 p-6 md:col-span-2 xl:col-span-1"
        >
          <p className="eyebrow">Regional impact</p>
          <H id="impact-regional-heading" className="mt-2 font-display text-lg font-semibold">
            Where it happened
          </H>
          <div className="mt-4">
            <RegionalImpact nodes={places} arcs={arcs} />
          </div>
        </section>
      )}
    </div>
  )
}
