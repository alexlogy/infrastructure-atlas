import Link from 'next/link'

import type { SiteSettingsView } from '@/types/view-models'

export function SiteHeader({ settings }: { settings: SiteSettingsView }) {
  const links = [
    ...(settings.showJourney ? [{ label: 'Journey', href: '/journey' }] : []),
    ...(settings.showImpact ? [{ label: 'Impact', href: '/impact' }] : []),
    ...settings.navLinks,
  ]

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight hover:text-accent">
          {settings.siteTitle}
        </Link>
        {links.length > 0 && (
          <nav aria-label="Primary">
            <ul className="flex flex-wrap gap-6 text-sm">
              {links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <NavAnchor {...link} />
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  )
}

function NavAnchor({ label, href }: { label: string; href: string }) {
  const className = 'text-muted underline-offset-4 hover:text-accent hover:underline'
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
