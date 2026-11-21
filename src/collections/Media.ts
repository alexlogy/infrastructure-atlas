import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'
import { publishedMediaOrAuthenticated } from '@/access/publishedMedia'

/**
 * Records and files are public only while published content uses them; editors
 * see everything. Optimised copies served by /_next/image can outlive an
 * unpublish by up to `images.minimumCacheTTL` (see docs/security.md).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: publishedMediaOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: {
    // Raster images only. SVG is excluded because it can carry script.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
    // Access depends on publish state and the viewer, so shared caches must not keep a copy.
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'private, no-cache')
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image for screen-reader users.' },
    },
    {
      name: 'attribution',
      type: 'text',
      admin: { description: 'Optional credit or licence note shown with the image.' },
    },
  ],
}
