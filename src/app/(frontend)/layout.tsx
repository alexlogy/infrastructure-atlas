import type { Metadata } from 'next'
import React from 'react'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { getPreviewUser } from '@/lib/payload/preview'
import { ghostConfig } from '@/lib/ghost'
import { pageMetadata } from '@/lib/metadata'
import { getSiteSettings, getWritingSettings } from '@/lib/payload/public'
import { siteOrigin } from '@/lib/seo'

import './styles.css'

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

  return (
    <html lang={settings.locale}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <SkipLink />
        {previewUser && <PreviewBanner />}
        <SiteHeader settings={settings} showWriting={Boolean(ghostConfig) && writing.enabled} />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter siteTitle={settings.siteTitle} />
      </body>
    </html>
  )
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
