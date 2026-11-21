import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '@/access'
import { publicRichTextEditor } from '@/fields/richText'
import { affectsPublishedContent, expireTag } from '@/lib/cache/revalidate'
import { CACHE_TAGS } from '@/lib/cache/tags'
import { isValidDateRange } from '@/lib/validation/dates'

export const TimelineMilestones: CollectionConfig = {
  slug: 'timeline-milestones',
  labels: { singular: 'Milestone', plural: 'Milestones' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'era', 'featured', '_status'],
  },
  defaultSort: 'startDate',
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
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
        if (affectsPublishedContent(doc, previousDoc)) expireTag(CACHE_TAGS.timeline, req)
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req }) => {
        if (affectsPublishedContent(doc)) expireTag(CACHE_TAGS.timeline, req)
        return doc
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 120 },
    { name: 'subtitle', type: 'text', maxLength: 160 },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayOnly' },
            description: 'Leave empty for a single point in time or an ongoing period.',
          },
          validate: (value: unknown, { siblingData }: { siblingData: { startDate?: string } }) =>
            isValidDateRange(siblingData?.startDate, value as string | null | undefined) ||
            'End date must be on or after the start date.',
        },
        {
          name: 'datePrecision',
          type: 'select',
          required: true,
          defaultValue: 'month',
          options: [
            { label: 'Year', value: 'year' },
            { label: 'Month', value: 'month' },
            { label: 'Day', value: 'day' },
          ],
          admin: { description: 'How precisely the dates are shown publicly.' },
        },
      ],
    },
    {
      name: 'description',
      type: 'richText',
      editor: publicRichTextEditor,
    },
    {
      name: 'era',
      type: 'text',
      maxLength: 60,
      admin: { description: 'Optional grouping label, e.g. "Early career".' },
    },
    { name: 'tags', type: 'text', hasMany: true, maxRows: 12 },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'atlas-locations',
      admin: { description: 'Optional place on the atlas this milestone belongs to.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'featured', type: 'checkbox', defaultValue: false },
        {
          name: 'sortOrder',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Tie-breaker for milestones on the same date (lower first).' },
        },
      ],
    },
  ],
}
