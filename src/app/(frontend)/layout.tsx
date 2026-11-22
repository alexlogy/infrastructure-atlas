import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import React from 'react'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { getPreviewUser } from '@/lib/payload/preview'
import { ghostConfig } from '@/lib/ghost'
import { pageMetadata } from '@/lib/metadata'
import { getSiteSettings, getWritingSettings } from '@/lib/payload/public'
import { siteOrigin } from '@/lib/seo'

import type { NavLink, SiteSettingsView } from '@/types/view-models'

import './styles.css'

// Self-hosted at build time by next/font: no request to Google from visitors' browsers.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

// Rendered per request; CMS reads are cached by tag and invalidated on publish.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    ...(await pageMetadata({})),
    title: { default: settings.siteTitle, template: `%s · ${settings.siteTitle}` },
    metadataBase: new URL(siteOrigin()),
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, writing, previewUser] = await Promise.all([
    getSiteSettings(),
    getWritingSettings(),
    getPreviewUser(),
  ])

  const links = primaryLinks(settings, Boolean(ghostConfig) && writing.enabled)

  return (
    <html lang={settings.locale} className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <SkipLink />
        {previewUser && <PreviewBanner />}
        <SiteHeader siteTitle={settings.siteTitle} links={links} contact={settings.contact} />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter
          siteTitle={settings.siteTitle}
          links={links}
          contact={settings.contact}
          blogUrl={ghostConfig?.url ?? null}
        />
      </body>
    </html>
  )
}

/** Built-in sections (when switched on), then the editor's extra links. */
function primaryLinks(settings: SiteSettingsView, showWriting: boolean): NavLink[] {
  return [
    { label: 'Home', href: '/' },
    ...(settings.showJourney ? [{ label: 'Journey', href: '/journey' }] : []),
    ...(settings.showImpact ? [{ label: 'Impact', href: '/impact' }] : []),
    ...(settings.showAtlas ? [{ label: 'Atlas', href: '/atlas' }] : []),
    ...(showWriting ? [{ label: 'Writing', href: '/writing' }] : []),
    ...settings.navLinks,
  ]
}

function PreviewBanner() {
  return (
    <div role="status" className="bg-gold px-6 py-2 text-center text-sm text-midnight">
      Preview mode: unpublished drafts are visible to you only.{' '}
      {/* Full navigation to a route handler that clears a cookie; <Link> would prefetch/RSC-fetch it. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/exit-preview" className="font-semibold underline underline-offset-4">
        Exit preview
      </a>
    </div>
  )
}
