import Link from 'next/link'

import type { NavLink } from '@/types/view-models'

import { HeaderNav } from './HeaderNav'

export function SiteHeader({
  siteTitle,
  links,
  contact,
}: {
  siteTitle: string
  links: NavLink[]
  contact: NavLink | null
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-midnight/90 supports-[backdrop-filter]:bg-midnight/75 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="container-page flex h-(--header-height) items-center justify-between gap-6">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight hover:text-accent"
        >
          {siteTitle}
        </Link>
        <HeaderNav links={links} contact={contact} />
      </div>
    </header>
  )
}
