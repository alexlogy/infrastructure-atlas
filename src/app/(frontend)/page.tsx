import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { ContactSection } from '@/components/about/ContactSection'
import { Principles } from '@/components/about/Principles'
import { LabGrid } from '@/components/lab/LabCard'
import { PostGrid } from '@/components/writing/PostCard'
import { PlaceGlobe } from '@/components/atlas/PlaceGlobe'
import { MetricStrip } from '@/components/hero/MetricStrip'
import { SmartLink } from '@/components/layout/SmartLink'
import { ImpactSection } from '@/components/impact/ImpactSection'
import { JourneyScene } from '@/components/journey/JourneyScene'
import { getGhostPosts, ghostConfig } from '@/lib/ghost'
import { pageMetadata } from '@/lib/metadata'
import {
  getAboutPage,
  getAtlas,
  getPublicAchievements,
  getPublicLabProjects,
  getHomePage,
  getPublicProjects,
  getPublicTimeline,
  getSiteSettings,
  getWritingSettings,
} from '@/lib/payload/public'
import { arrangePosts } from '@/lib/writing'
import type { AtlasView, GhostPostView, NavLink } from '@/types/view-models'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ path: '/' })
}

type Props = { searchParams: Promise<{ project?: string | string[]; view?: string | string[] }> }

export default async function HomePage({ searchParams }: Props) {
  const [settings, home] = await Promise.all([getSiteSettings(), getHomePage()])

  const [projects, milestones, achievements, about, lab, posts] = await Promise.all([
    settings.showImpact ? getPublicProjects() : [],
    settings.showJourney ? getPublicTimeline() : [],
    getPublicAchievements(),
    getAboutPage(),
    getPublicLabProjects(),
    homePosts(),
  ])
  const atlas: AtlasView | null = settings.showAtlas ? await getAtlas() : null

  const actions: NavLink[] =
    home.callsToAction.length > 0
      ? home.callsToAction
      : [
          ...(settings.showJourney ? [{ label: 'Explore my journey', href: '/journey' }] : []),
          ...(settings.showImpact ? [{ label: 'View selected impact', href: '/impact' }] : []),
        ]

  const hasAtlas = Boolean(atlas && atlas.nodes.length > 0)

  return (
    <>
      <section
        className="container-page pt-12 pb-16 md:pt-16 lg:pb-24"
        aria-labelledby="home-heading"
      >
        <div
          className={`grid items-center gap-10 ${
            hasAtlas || home.heroImage ? 'lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]' : ''
          }`}
        >
          <div className="reveal">
            {home.eyebrow && <p className="eyebrow">{home.eyebrow}</p>}
            <h1 id="home-heading" className="mt-4 max-w-3xl text-hero font-semibold">
              {home.headline ?? settings.siteTitle}
              {home.headlineEmphasis && (
                <span className="block text-accent">{home.headlineEmphasis}</span>
              )}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
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

          {atlas && hasAtlas ? (
            <div className="lg:-mr-6">
              <PlaceGlobe
                nodes={atlas.nodes}
                arcs={atlas.arcs}
                center={settings.atlasCenter}
                className="max-w-[36rem]"
                overview={
                  <>
                    <p className="text-xs font-medium tracking-wide text-accent uppercase">Atlas</p>
                    <p className="mt-1 text-sm text-ink/90">
                      {count(atlas.nodes.length, 'place')}
                      {atlas.arcs.length > 0 && `, ${count(atlas.arcs.length, 'connection')}`}, with
                      the projects and milestones behind them.
                    </p>
                    <Link
                      href="/atlas"
                      className="mt-3 inline-flex text-sm font-medium text-accent underline-offset-4 hover:text-ink hover:underline"
                    >
                      Explore the atlas →
                    </Link>
                  </>
                }
              />
            </div>
          ) : (
            home.heroImage && (
              <Image
                src={home.heroImage.url}
                alt={home.heroImage.alt}
                width={home.heroImage.width ?? 800}
                height={home.heroImage.height ?? 800}
                sizes="(min-width: 1024px) 40vw, 100vw"
                priority
                className="mx-auto h-auto w-full max-w-md rounded-2xl"
              />
            )
          )}
        </div>
        {achievements.length > 0 && (
          <div className="mt-12 lg:mt-16">
            <MetricStrip achievements={achievements} />
          </div>
        )}
      </section>

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
      {about.hasContent && (
        <section className="container-page section-y" aria-labelledby="home-philosophy-heading">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div>
              <p className="eyebrow">Philosophy</p>
              <h2 id="home-philosophy-heading" className="mt-3 text-section font-semibold">
                {about.statement ?? 'How I work'}
              </h2>
              <Link
                href="/about"
                className="mt-6 inline-flex font-medium text-accent underline underline-offset-4 hover:text-ink"
              >
                Read the philosophy
              </Link>
            </div>
            {about.principles.length > 0 && (
              <Principles principles={about.principles.slice(0, 3)} columns="sm:grid-cols-3" />
            )}
          </div>
        </section>
      )}

      {lab.length > 0 && (
        <section className="container-page section-y" aria-labelledby="home-lab-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Engineering Lab</p>
              <h2 id="home-lab-heading" className="mt-3 text-section font-semibold">
                Lab
              </h2>
            </div>
            <Link
              href="/lab"
              className="font-medium text-accent underline underline-offset-4 hover:text-ink"
            >
              Visit the lab
            </Link>
          </div>
          <div className="mt-8">
            <LabGrid projects={lab.slice(0, 3)} />
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="container-page section-y" aria-labelledby="home-writing-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Writing</p>
              <h2 id="home-writing-heading" className="mt-3 text-section font-semibold">
                Selected writing
              </h2>
            </div>
            <Link
              href="/writing"
              className="font-medium text-accent underline underline-offset-4 hover:text-ink"
            >
              All writing
            </Link>
          </div>
          <div className="mt-8">
            <PostGrid posts={posts} locale={settings.locale} />
          </div>
        </section>
      )}

      <ContactSection contact={about.contact} button={settings.contact} />
    </>
  )
}

/** Featured posts first, then recent, three at most; empty when Ghost is off or unreachable. */
async function homePosts(): Promise<GhostPostView[]> {
  const writing = await getWritingSettings()
  if (!ghostConfig || !writing.enabled) return []
  const { featured, recent } = await getGhostPosts(writing)
  const { lead, rest } = arrangePosts(featured, recent, null)
  return [...(lead ? [lead] : []), ...rest].slice(0, 3)
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
