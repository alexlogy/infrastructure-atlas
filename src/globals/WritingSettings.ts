import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { expireTag } from '@/lib/cache/revalidate'
import { CACHE_TAGS } from '@/lib/cache/tags'
import { isValidSlug } from '@/lib/validation/slugs'

const slugList = (value: unknown) =>
  value == null ||
  (Array.isArray(value) && value.every((v) => typeof v === 'string' && isValidSlug(v))) ||
  'Use Ghost slugs: lowercase letters, numbers and single hyphens.'

/**
 * Display options for the Writing section. The Ghost URL and Content API key
 * are environment variables (GHOST_URL, GHOST_CONTENT_API_KEY), never CMS fields.
 */
export const WritingSettings: GlobalConfig = {
  slug: 'writing-settings',
  label: 'Writing settings',
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [({ req }) => expireTag(CACHE_TAGS.writing, req)],
  },
  admin: {
    description:
      'Shows recent posts from the Ghost blog configured on the server. Has no effect until GHOST_URL and GHOST_CONTENT_API_KEY are set.',
  },
  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: true },
    {
      name: 'recentCount',
      label: 'Number of recent posts',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 20,
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'includeTags',
          type: 'text',
          hasMany: true,
          maxRows: 10,
          validate: slugList,
          admin: { description: 'Only show posts with one of these tag slugs. Empty = all.' },
        },
        {
          name: 'excludeTags',
          type: 'text',
          hasMany: true,
          maxRows: 10,
          validate: slugList,
          admin: { description: 'Never show posts with these tag slugs.' },
        },
      ],
    },
    {
      name: 'featuredSlugs',
      label: 'Featured post slugs',
      type: 'text',
      hasMany: true,
      maxRows: 6,
      validate: slugList,
      admin: {
        description:
          'Shown first, in this order. Renamed or deleted posts are skipped automatically.',
      },
    },
  ],
}
