import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { expireTag } from '@/lib/cache/revalidate'
import { CACHE_TAGS } from '@/lib/cache/tags'
import { isSafeHref } from '@/lib/validation/links'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Home page',
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [({ req }) => expireTag(CACHE_TAGS.homePage, req)],
  },
  fields: [
    {
      name: 'headline',
      type: 'text',
      maxLength: 120,
      admin: { description: 'Leave empty to use the site title.' },
    },
    {
      name: 'subheadline',
      type: 'textarea',
      maxLength: 400,
      admin: { description: 'Leave empty to use the site description.' },
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    {
      name: 'callsToAction',
      type: 'array',
      maxRows: 2,
      admin: { description: 'Leave empty to link to the enabled sections.' },
      fields: [
        { name: 'label', type: 'text', required: true, maxLength: 40 },
        {
          name: 'href',
          type: 'text',
          required: true,
          validate: (value: string | null | undefined) =>
            (typeof value === 'string' && isSafeHref(value)) ||
            'Use a site path like /impact or a full https:// URL.',
        },
      ],
    },
    {
      name: 'featuredProjects',
      type: 'relationship',
      relationTo: 'impact-projects',
      hasMany: true,
      maxRows: 6,
      admin: { description: 'Shown in this order. Unpublished projects are skipped.' },
    },
  ],
}
