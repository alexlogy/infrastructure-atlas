import Link from 'next/link'
import type { ComponentProps } from 'react'

/** next/link for site paths and anchors; a plain anchor (no referrer, no opener) for other URLs. */
export function SmartLink({
  href,
  ...props
}: Omit<ComponentProps<'a'>, 'href'> & { href: string }) {
  if (href.startsWith('/') || href.startsWith('#')) return <Link href={href} {...props} />
  return <a href={href} rel="noopener noreferrer" {...props} />
}
