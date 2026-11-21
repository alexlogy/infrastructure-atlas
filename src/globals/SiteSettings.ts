import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { expireTag } from '@/lib/cache/revalidate'
import { CACHE_TAGS } from '@/lib/cache/tags'
import { isSafeHref } from '@/lib/validation/links'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [({ req }) => expireTag(CACHE_TAGS.siteSettings, req)],
  },
  fields: [
    {
      name: 'siteTitle',
      type: 'text',
      maxLength: 80,
      admin: {
        description: 'Shown in the header and browser tab. Leave empty for a neutral default.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 300,
      admin: { description: 'Short introduction and default SEO description.' },
    },
    {
      name: 'locale',
      type: 'text',
      defaultValue: 'en',
      maxLength: 35,
      validate: (value: string | null | undefined) =>
        !value ||
        /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(value) ||
        'Use a BCP 47 tag such as "en" or "en-GB".',
    },
    {
      name: 'navLinks',
      label: 'Extra navigation links',
      type: 'array',
      maxRows: 8,
      fields: [
        { name: 'label', type: 'text', required: true, maxLength: 40 },
        {
          name: 'href',
          type: 'text',
          required: true,
          validate: (value: string | null | undefined) =>
            (typeof value === 'string' && isSafeHref(value)) ||
            'Use a site path like /journey or a full https:// URL.',
        },
      ],
    },
    {
      name: 'sections',
      label: 'Section visibility',
      type: 'group',
      fields: [
        { name: 'journey', label: 'Show Journey', type: 'checkbox', defaultValue: true },
        { name: 'impact', label: 'Show Impact', type: 'checkbox', defaultValue: true },
      ],
    },
  ],
}
