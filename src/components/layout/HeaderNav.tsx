'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import type { NavLink } from '@/types/view-models'

import { SmartLink } from './SmartLink'

/** Active when on the page itself or one of its children (e.g. /impact/x under /impact). */
export const isActive = (pathname: string, href: string): boolean =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

/**
 * Primary navigation. Desktop: inline links with an underline on the current page.
 * Mobile: a disclosure button that opens the same list, closes on Escape, on a link
 * choice or on navigation, and returns focus to the button.
 */
export function HeaderNav({ links, contact }: { links: NavLink[]; contact: NavLink | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [openedAt, setOpenedAt] = useState(pathname)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  // Navigating (including back/forward) closes the menu.
  if (open && openedAt !== pathname) setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const items = (mobile: boolean) =>
    links.map((link) => {
      const active = isActive(pathname, link.href)
      return (
        <li key={`${link.href}-${link.label}`}>
          <SmartLink
            href={link.href}
            aria-current={active ? 'page' : undefined}
            onClick={mobile ? () => setOpen(false) : undefined}
            className={`${
              mobile ? 'block py-3 text-base' : 'text-sm'
            } underline-offset-[10px] decoration-2 transition-colors duration-150 hover:text-ink ${
              active ? 'text-ink underline decoration-accent' : 'text-muted'
            }`}
          >
            {link.label}
          </SmartLink>
        </li>
      )
    })

  const contactButton = contact && (
    <SmartLink
      href={contact.href}
      className="inline-flex min-h-11 items-center rounded-lg border border-accent/70 px-4 text-sm font-medium text-ink transition-colors duration-150 hover:border-accent hover:bg-accent hover:text-midnight"
    >
      {contact.label}
    </SmartLink>
  )

  return (
    <>
      <div className="hidden items-center gap-8 lg:flex">
        {links.length > 0 && (
          <nav aria-label="Primary">
            <ul className="flex items-center gap-7">{items(false)}</ul>
          </nav>
        )}
        {contactButton}
      </div>

      {(links.length > 0 || contact) && (
        <div className="lg:hidden">
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => {
              setOpen(!open)
              setOpenedAt(pathname)
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium hover:border-accent"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
              <path
                d={open ? 'M3 3l10 10M13 3L3 13' : 'M2 4h12M2 8h12M2 12h12'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Menu
          </button>
          <div
            id={panelId}
            hidden={!open}
            className="absolute inset-x-0 top-full border-b border-line bg-midnight shadow-2xl"
          >
            <nav aria-label="Primary" className="container-page py-4">
              <ul className="divide-y divide-line/60">{items(true)}</ul>
              {contactButton && <div className="pt-4 pb-2">{contactButton}</div>}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
