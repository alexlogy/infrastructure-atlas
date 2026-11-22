import type { NavLink } from '@/types/view-models'

import { SmartLink } from './SmartLink'

export function SiteFooter({
  siteTitle,
  links,
  contact,
  blogUrl,
}: {
  siteTitle: string
  links: NavLink[]
  contact: NavLink | null
  blogUrl: string | null
}) {
  const footerLinks = [
    ...links,
    ...(blogUrl ? [{ label: 'Blog', href: blogUrl }] : []),
    ...(contact ? [contact] : []),
  ]

  return (
    <footer className="mt-24 border-t border-line/60 bg-deep/60">
      <div className="container-page flex flex-col gap-8 py-12 text-sm text-muted md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-base font-semibold text-ink">{siteTitle}</p>
          <p className="mt-2">
            © {new Date().getFullYear()} {siteTitle}
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3">
            {footerLinks.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <SmartLink
                  href={link.href}
                  className="underline-offset-4 hover:text-accent hover:underline"
                >
                  {link.label}
                </SmartLink>
              </li>
            ))}
            <li>
              <a href="#main" className="underline-offset-4 hover:text-accent hover:underline">
                Back to top
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
