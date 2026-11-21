import Link from 'next/link'

import { getSiteSettings } from '@/lib/payload/public'

export default async function HomePage() {
  const settings = await getSiteSettings()

  return (
    <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32" aria-labelledby="home-heading">
      <h1 id="home-heading" className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
        {settings.siteTitle}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
        {settings.description ??
          'This site has not been configured yet. Add a title and description under Site settings in the content admin.'}
      </p>
      {settings.showJourney && (
        <p className="mt-10">
          <Link
            href="/journey"
            className="inline-flex items-center rounded-md bg-accent px-5 py-3 font-medium text-midnight transition-colors hover:bg-ink"
          >
            Explore the journey
          </Link>
        </p>
      )}
    </section>
  )
}
