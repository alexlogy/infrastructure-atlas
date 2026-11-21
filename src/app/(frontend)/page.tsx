import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { ProjectGrid } from '@/components/impact/ProjectCard'
import { pageMetadata } from '@/lib/metadata'
import { getHomePage, getPublicProjects, getSiteSettings } from '@/lib/payload/public'
import type { NavLink, ProjectSummaryView } from '@/types/view-models'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ path: '/' })
}

export default async function HomePage() {
  const [settings, home] = await Promise.all([getSiteSettings(), getHomePage()])

  const featured: ProjectSummaryView[] =
    settings.showImpact && home.featuredProjectIds.length > 0
      ? pickInOrder(await getPublicProjects(), home.featuredProjectIds)
      : []

  const actions: NavLink[] =
    home.callsToAction.length > 0
      ? home.callsToAction
      : [
          ...(settings.showJourney ? [{ label: 'Explore the journey', href: '/journey' }] : []),
          ...(settings.showImpact ? [{ label: 'See the impact', href: '/impact' }] : []),
        ]

  return (
    <>
      <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32" aria-labelledby="home-heading">
        <div className="grid items-center gap-12 md:grid-cols-[3fr_2fr]">
          <div>
            <h1
              id="home-heading"
              className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              {home.headline ?? settings.siteTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {home.subheadline ??
                settings.description ??
                'This site has not been configured yet. Add a headline under Home page in the content admin.'}
            </p>
            {actions.length > 0 && (
              <ul className="mt-10 flex flex-wrap gap-4">
                {actions.map((action, i) => (
                  <li key={`${action.href}-${action.label}`}>
                    <ActionLink {...action} primary={i === 0} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          {home.heroImage && (
            <Image
              src={home.heroImage.url}
              alt={home.heroImage.alt}
              width={home.heroImage.width ?? 800}
              height={home.heroImage.height ?? 800}
              sizes="(min-width: 768px) 400px, 100vw"
              priority
              className="h-auto w-full rounded-lg"
            />
          )}
        </div>
      </section>

      {featured.length > 0 && (
        <section
          className="mx-auto max-w-5xl px-6 pb-24"
          aria-labelledby="featured-projects-heading"
        >
          <h2 id="featured-projects-heading" className="text-2xl font-semibold">
            Selected projects
          </h2>
          <div className="mt-8">
            <ProjectGrid projects={featured} />
          </div>
        </section>
      )}
    </>
  )
}

/** Published projects in the editor's chosen order; unpublished ids drop out. */
function pickInOrder(projects: ProjectSummaryView[], ids: string[]): ProjectSummaryView[] {
  const byId = new Map(projects.map((p) => [p.id, p]))
  return ids.flatMap((id) => byId.get(id) ?? [])
}

function ActionLink({ label, href, primary }: NavLink & { primary: boolean }) {
  const className = `inline-flex items-center rounded-md px-5 py-3 font-medium transition-colors ${
    primary
      ? 'bg-accent text-midnight hover:bg-ink'
      : 'border border-line text-ink hover:border-accent hover:text-accent'
  }`
  if (href.startsWith('/') || href.startsWith('#')) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    )
  }
  return (
    <a href={href} className={className} rel="noopener noreferrer">
      {label}
    </a>
  )
}
