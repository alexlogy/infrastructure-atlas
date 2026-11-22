import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { HomeGlobe } from '@/components/atlas/HomeGlobe'
import { SmartLink } from '@/components/layout/SmartLink'
import { ImpactSection } from '@/components/impact/ImpactSection'
import { JourneyScene } from '@/components/journey/JourneyScene'
import { pageMetadata } from '@/lib/metadata'
import {
  getAtlas,
  getHomePage,
  getPublicProjects,
  getPublicTimeline,
  getSiteSettings,
} from '@/lib/payload/public'
import type { AtlasView, NavLink } from '@/types/view-models'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ path: '/' })
}

type Props = { searchParams: Promise<{ project?: string | string[]; view?: string | string[] }> }

export default async function HomePage({ searchParams }: Props) {
  const [settings, home] = await Promise.all([getSiteSettings(), getHomePage()])

  const [projects, milestones] = await Promise.all([
    settings.showImpact ? getPublicProjects() : [],
    settings.showJourney ? getPublicTimeline() : [],
  ])
  const atlas: AtlasView | null = settings.showAtlas ? await getAtlas() : null

  const actions: NavLink[] =
    home.callsToAction.length > 0
      ? home.callsToAction
      : [
          ...(settings.showJourney ? [{ label: 'Explore the journey', href: '/journey' }] : []),
          ...(settings.showImpact ? [{ label: 'See the impact', href: '/impact' }] : []),
        ]

  return (
    <>
      <section className="container-page section-y" aria-labelledby="home-heading">
        <div className="grid items-center gap-12 md:grid-cols-[3fr_2fr]">
          <div>
            <h1 id="home-heading" className="max-w-3xl text-hero font-semibold">
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

      {atlas && atlas.nodes.length > 0 && (
        <section className="container-page pb-24" aria-labelledby="home-atlas-heading">
          <div className="grid items-center gap-12 rounded-lg border border-line p-8 md:grid-cols-[2fr_3fr]">
            <div>
              <h2 id="home-atlas-heading" className="text-section font-semibold">
                Atlas
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                {count(atlas.nodes.length, 'place')}
                {atlas.arcs.length > 0 && `, ${count(atlas.arcs.length, 'connection')}`}, with the
                projects and milestones behind them.
              </p>
              <Link
                href="/atlas"
                className="mt-6 inline-flex font-medium text-accent underline underline-offset-4 hover:text-ink"
              >
                Explore the atlas
              </Link>
            </div>
            <HomeGlobe atlas={atlas} center={settings.atlasCenter} />
          </div>
        </section>
      )}

      {milestones.length > 0 && (
        <section className="container-page section-y" aria-labelledby="home-journey-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Career journey</p>
              <h2 id="home-journey-heading" className="mt-3 text-section font-semibold">
                Journey
              </h2>
            </div>
            <Link
              href="/journey"
              className="font-medium text-accent underline underline-offset-4 hover:text-ink"
            >
              See the full journey
            </Link>
          </div>
          <div className="mt-8">
            <JourneyScene milestones={milestones} projects={projects} locale={settings.locale} />
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="container-page section-y" aria-labelledby="home-impact-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Selected work</p>
              <h2 id="home-impact-heading" className="mt-3 text-section font-semibold">
                Impact
              </h2>
            </div>
            <Link
              href="/impact"
              className="font-medium text-accent underline underline-offset-4 hover:text-ink"
            >
              All projects
            </Link>
          </div>
          <div className="mt-8">
            <ImpactSection
              projects={projects}
              chosenIds={home.featuredProjectIds}
              query={await searchParams}
              basePath="/"
              atlas={atlas}
            />
          </div>
        </section>
      )}
    </>
  )
}

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

function ActionLink({ label, href, primary }: NavLink & { primary: boolean }) {
  return (
    <SmartLink
      href={href}
      className={`inline-flex min-h-11 items-center rounded-lg px-5 py-3 font-medium transition-colors duration-150 ${
        primary
          ? 'bg-accent text-midnight hover:bg-ice'
          : 'border border-line text-ink hover:border-accent hover:text-accent'
      }`}
    >
      {label}
    </SmartLink>
  )
}
