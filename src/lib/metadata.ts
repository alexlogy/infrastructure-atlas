import 'server-only'

import type { Metadata } from 'next'

import { getSiteSettings } from '@/lib/payload/public'
import type { ImageView } from '@/types/view-models'

/**
 * Complete page metadata from published CMS data. Next.js replaces a parent's
 * `openGraph` object instead of merging it, so every page builds the full set.
 * Relative URLs resolve against `metadataBase` (NEXT_PUBLIC_SITE_URL).
 */
export async function pageMetadata({
  title,
  description,
  path,
  image,
}: {
  title?: string
  description?: string | null
  path?: string
  image?: ImageView | null
}): Promise<Metadata> {
  const settings = await getSiteSettings()
  const text = description ?? settings.description ?? undefined
  const shareImage = image ?? settings.shareImage
  const fullTitle = title ? `${title} · ${settings.siteTitle}` : settings.siteTitle
  const images = shareImage
    ? [
        {
          url: shareImage.url,
          alt: shareImage.alt,
          ...(shareImage.width && shareImage.height
            ? { width: shareImage.width, height: shareImage.height }
            : {}),
        },
      ]
    : undefined

  return {
    ...(title ? { title } : {}),
    description: text,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: 'website',
      siteName: settings.siteTitle,
      locale: settings.locale.replace('-', '_'),
      title: fullTitle,
      description: text,
      ...(path ? { url: path } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: fullTitle,
      description: text,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  }
}
