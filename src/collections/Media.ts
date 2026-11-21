import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'

/**
 * Uploaded files are publicly readable by URL (needed for published pages).
 * Do not upload confidential material: attaching media to a draft does not hide the file.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: {
    // Raster images only. SVG is excluded because it can carry script.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
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
