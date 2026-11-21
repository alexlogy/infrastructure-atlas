import type { Metadata } from 'next'
import React from 'react'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { getSiteSettings } from '@/lib/payload/public'

import './styles.css'

// Rendered per request; CMS reads are cached by tag and invalidated on publish.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: { default: settings.siteTitle, template: `%s · ${settings.siteTitle}` },
    description: settings.description ?? undefined,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  return (
    <html lang={settings.locale}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <SkipLink />
        <SiteHeader settings={settings} />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter siteTitle={settings.siteTitle} />
      </body>
    </html>
  )
}
