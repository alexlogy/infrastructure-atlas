import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '@/access'
import { affectsPublishedContent, expireTag } from '@/lib/cache/revalidate'
import { CACHE_TAGS } from '@/lib/cache/tags'
import { LAB_STATUSES } from '@/lib/lab'
import { isSafeHref } from '@/lib/validation/links'

/**
 * Engineering Lab entries: experiments, prototypes and tools. Each links out to its write-up or
 * repository rather than having a page of its own. Keep hostnames, addresses and private network
 * details out of summaries and diagrams.
 */
export const LabProjects: CollectionConfig = {
  slug: 'lab-projects',
  labels: { singular: 'Lab project', plural: 'Lab projects' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'stage', 'featured', '_status'],
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
        if (affectsPublishedContent(doc, previousDoc)) expireTag(CACHE_TAGS.lab, req)
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req }) => {
        if (affectsPublishedContent(doc)) expireTag(CACHE_TAGS.lab, req)
        return doc
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 120 },
    {
      type: 'row',
      fields: [
        { name: 'category', type: 'text', maxLength: 40 },
        {
          // Not "status": that would clash with the drafts `_status` enum in Postgres.
          name: 'stage',
          label: 'Status',
          type: 'select',
          defaultValue: 'active',
          options: LAB_STATUSES.map((value) => ({
            value,
            label: value[0].toUpperCase() + value.slice(1),
          })),
        },
      ],
    },
    { name: 'summary', type: 'textarea', required: true, maxLength: 300 },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      maxRows: 8,
      admin: { description: 'Stack or theme, e.g. "automation". Visitors can filter by tag.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'A diagram or screenshot. Its alt text is the text alternative.' },
    },
    {
      name: 'link',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', maxLength: 40, defaultValue: 'Read more' },
            {
              name: 'href',
              type: 'text',
              validate: (value: string | null | undefined) =>
                !value || isSafeHref(value) || 'Use a site path or a full https:// URL.',
            },
          ],
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'The first featured entry leads the Lab page.' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower values are listed first.' },
    },
  ],
}
