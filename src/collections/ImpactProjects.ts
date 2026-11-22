import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '@/access'
import { publicRichTextEditor } from '@/fields/richText'
import { affectsPublishedContent, expireTag } from '@/lib/cache/revalidate'
import { CACHE_TAGS } from '@/lib/cache/tags'
import { PROJECT_ICONS } from '@/lib/project-icons'
import { isSafeHref } from '@/lib/validation/links'
import { isValidSlug, SLUG_MAX_LENGTH, toSlug } from '@/lib/validation/slugs'

const prose = (name: string, description: string) => ({
  name,
  type: 'richText' as const,
  editor: publicRichTextEditor,
  admin: { description },
})

export const ImpactProjects: CollectionConfig = {
  slug: 'impact-projects',
  labels: { singular: 'Impact project', plural: 'Impact projects' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'featured', 'sortOrder', '_status'],
    // Opens the draft through the authenticated preview route; no button until a slug exists.
    preview: ({ slug }) =>
      typeof slug === 'string' && isValidSlug(slug)
        ? `/api/preview?path=${encodeURIComponent(`/impact/${slug}`)}`
        : null,
  },
  defaultSort: 'sortOrder',
  versions: { drafts: true, maxPerDoc: 50 },
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
        if (affectsPublishedContent(doc, previousDoc)) expireTag(CACHE_TAGS.projects, req)
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req }) => {
        if (affectsPublishedContent(doc)) expireTag(CACHE_TAGS.projects, req)
        return doc
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 120 },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: SLUG_MAX_LENGTH,
      admin: {
        position: 'sidebar',
        description: 'URL segment, e.g. "sample-project". Generated from the title when empty.',
      },
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) =>
            typeof value === 'string' && value.trim()
              ? value.trim()
              : toSlug(String(siblingData?.title ?? '')),
        ],
      },
      validate: (value: string | null | undefined) =>
        (typeof value === 'string' && isValidSlug(value)) ||
        'Use lowercase letters, numbers and single hyphens.',
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            { name: 'summary', type: 'textarea', required: true, maxLength: 300 },
            {
              type: 'row',
              fields: [
                {
                  name: 'category',
                  type: 'text',
                  maxLength: 40,
                  admin: {
                    description: 'Short label on the impact tiles, e.g. "Platform" or "Security".',
                  },
                },
                {
                  name: 'icon',
                  type: 'select',
                  options: PROJECT_ICONS.map((value) => ({
                    value,
                    label: value[0].toUpperCase() + value.slice(1),
                  })),
                  admin: { description: 'Line icon on the impact tiles.' },
                },
              ],
            },
            { name: 'featuredImage', type: 'upload', relationTo: 'media' },
            { name: 'tags', type: 'text', hasMany: true, maxRows: 12 },
          ],
        },
        {
          label: 'Perspectives',
          description:
            'Two views of the same project. Visitors switch between them; leave one empty to hide the switch.',
          fields: [
            prose('leadershipNarrative', 'Scope, people, stakeholders and decisions.'),
            prose('engineeringNarrative', 'Systems, constraints and technical choices.'),
          ],
        },
        {
          label: 'Details',
          fields: [
            prose('challenge', 'The problem being solved.'),
            prose('architecture', 'How the solution is shaped.'),
            { name: 'diagram', type: 'upload', relationTo: 'media' },
            prose('decisions', 'Key decisions and trade-offs.'),
            {
              name: 'outcomes',
              type: 'array',
              maxRows: 12,
              admin: {
                description:
                  'Only record outcomes you can stand behind. Add a metric only when it was measured.',
              },
              fields: [
                { name: 'result', type: 'textarea', required: true, maxLength: 300 },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'metric',
                      type: 'text',
                      maxLength: 40,
                      admin: { description: 'e.g. "−30% latency". Empty = qualitative.' },
                    },
                    {
                      name: 'verification',
                      type: 'text',
                      maxLength: 200,
                      admin: { description: 'How this can be checked (source or method).' },
                    },
                  ],
                },
              ],
            },
            prose('limitations', 'What did not work, or what is still open.'),
            {
              name: 'sourceLinks',
              type: 'array',
              maxRows: 8,
              fields: [
                { name: 'label', type: 'text', required: true, maxLength: 80 },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  validate: (value: string | null | undefined) =>
                    (typeof value === 'string' && isSafeHref(value)) ||
                    'Use a site path or a full https:// URL.',
                },
              ],
            },
          ],
        },
        {
          label: 'Relationships',
          fields: [
            {
              name: 'milestones',
              type: 'relationship',
              relationTo: 'timeline-milestones',
              hasMany: true,
            },
            {
              name: 'locations',
              type: 'relationship',
              relationTo: 'atlas-locations',
              hasMany: true,
            },
          ],
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower values are listed first.' },
    },
  ],
}
