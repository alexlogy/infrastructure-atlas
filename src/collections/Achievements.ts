import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '@/access'
import { affectsPublishedContent, expireTag } from '@/lib/cache/revalidate'
import { CACHE_TAGS } from '@/lib/cache/tags'
import { PROJECT_ICONS } from '@/lib/project-icons'

/**
 * Headline metrics for the home page strip. Values are typed in by an editor and never computed or
 * filled in automatically: nothing shows until a real, published figure exists.
 */
export const Achievements: CollectionConfig = {
  slug: 'achievements',
  labels: { singular: 'Achievement', plural: 'Achievements' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'value', 'unit', 'sortOrder', '_status'],
    description: 'Up to four published achievements appear under the home page headline.',
  },
  defaultSort: 'sortOrder',
  versions: { drafts: true, maxPerDoc: 20 },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
    readVersions: authenticated,
  },
  hooks: {
    afterChange: [
      ({ doc, previousDoc, req }) => {
        if (affectsPublishedContent(doc, previousDoc)) expireTag(CACHE_TAGS.achievements, req)
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req }) => {
        if (affectsPublishedContent(doc)) expireTag(CACHE_TAGS.achievements, req)
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          maxLength: 16,
          admin: { description: 'The figure as displayed, e.g. "12" or "3.5".' },
        },
        {
          name: 'unit',
          type: 'text',
          maxLength: 12,
          admin: { description: 'Optional suffix, e.g. "+", "%" or "yrs".' },
        },
      ],
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      maxLength: 60,
      admin: { description: 'Short caption under the figure.' },
    },
    {
      name: 'explanation',
      type: 'textarea',
      maxLength: 300,
      admin: {
        description: 'How the figure was arrived at. Shown to assistive technology and on hover.',
      },
    },
    {
      name: 'icon',
      type: 'select',
      options: PROJECT_ICONS.map((value) => ({
        value,
        label: value[0].toUpperCase() + value.slice(1),
      })),
    },
    { name: 'project', type: 'relationship', relationTo: 'impact-projects' },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower values are shown first.' },
    },
  ],
}
