import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { ContactSection } from '@/components/about/ContactSection'
import { Principles } from '@/components/about/Principles'
import { PROSE_CLASS, RichText } from '@/components/RichText'
import { credentialStatus } from '@/lib/credentials'
import { formatDateRange } from '@/lib/dates'
import { pageMetadata } from '@/lib/metadata'
import { getAboutPage, getSiteSettings } from '@/lib/payload/public'

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutPage()
  return pageMetadata({
    title: 'Philosophy',
    description: about.statement ?? 'Principles, current focus and how to get in touch.',
    path: '/about',
    image: about.portrait,
  })
}

const STATUS_LABEL = { current: 'Current', expired: 'Expired', 'no-expiry': null } as const

export default async function AboutPage() {
  const [about, settings] = await Promise.all([getAboutPage(), getSiteSettings()])
  if (!about.hasContent) notFound()
  const hasDetails =
    about.principles.length > 0 || Boolean(about.currentFocus) || about.credentials.length > 0

  return (
    <>
      <section className="container-page section-y" aria-labelledby="about-heading">
        <div
          className={`grid items-start gap-12 ${
            about.portrait ? 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]' : ''
          }`}
        >
          <div>
            <p className="eyebrow">Philosophy</p>
            <h1 id="about-heading" className="mt-3 max-w-4xl text-page font-semibold">
              {about.statement ?? 'About'}
            </h1>
            {about.introduction && (
              <RichText data={about.introduction} className={`mt-8 max-w-2xl ${PROSE_CLASS}`} />
            )}
          </div>
          {about.portrait && (
            <Image
              src={about.portrait.url}
              alt={about.portrait.alt}
              width={about.portrait.width ?? 800}
              height={about.portrait.height ?? 1000}
              sizes="(min-width: 1024px) 30vw, 100vw"
              priority
              className="mx-auto h-auto w-full max-w-sm rounded-2xl border border-line"
            />
          )}
        </div>
      </section>

      {hasDetails && (
        <section className="container-page pb-16">
          <div
            className={`grid gap-12 ${
              about.credentials.length > 0 ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : ''
            }`}
          >
            <div className="space-y-16">
              {about.principles.length > 0 && (
                <div>
                  <h2 className="text-section font-semibold">Principles</h2>
                  <div className="mt-8">
                    <Principles principles={about.principles} />
                  </div>
                </div>
              )}
              {about.currentFocus && (
                <div>
                  <h2 className="text-section font-semibold">Current focus</h2>
                  <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
                    {about.currentFocus}
                  </p>
                </div>
              )}
            </div>

            {about.credentials.length > 0 && (
              <aside
                aria-labelledby="credentials-heading"
                className="self-start rounded-2xl border border-line bg-surface/60 p-6"
              >
                <h2 id="credentials-heading" className="font-display text-lg font-semibold">
                  Credentials
                </h2>
                <ul className="mt-4 divide-y divide-line/70">
                  {about.credentials.map((c) => {
                    const status = STATUS_LABEL[credentialStatus(c.expiresOn)]
                    const meta = [
                      c.issuer,
                      c.issuedOn && formatDateRange(c.issuedOn, null, 'month', settings.locale),
                    ].filter(Boolean)
                    return (
                      <li key={`${c.title}-${c.issuedOn}`} className="py-3 text-sm">
                        <p className="font-medium text-ink">
                          {c.url ? (
                            <a
                              href={c.url}
                              rel="noopener noreferrer"
                              className="underline-offset-4 hover:text-accent hover:underline"
                            >
                              {c.title}
                            </a>
                          ) : (
                            c.title
                          )}
                        </p>
                        <p className="mt-0.5 text-muted">
                          {meta.join(' · ')}
                          {status && (
                            <span className={status === 'Expired' ? 'text-subtle' : 'text-success'}>
                              {meta.length > 0 ? ' · ' : ''}
                              {status}
                            </span>
                          )}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </aside>
            )}
          </div>
        </section>
      )}

      <ContactSection contact={about.contact} button={settings.contact} />
    </>
  )
}
