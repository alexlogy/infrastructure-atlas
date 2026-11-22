import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { publicRichTextEditor } from '@/fields/richText'
import { expireTag } from '@/lib/cache/revalidate'
import { CACHE_TAGS } from '@/lib/cache/tags'
import { isSafeHref } from '@/lib/validation/links'

const safeHref = (value: string | null | undefined) =>
  (typeof value === 'string' && isSafeHref(value)) ||
  'Use a site path, a full https:// URL or a mailto: address.'

/**
 * The Philosophy page (/about) and the home page's philosophy and contact sections. Everything is
 * optional: the page and its navigation link stay hidden until a statement, introduction or
 * principle is filled in.
 */
export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'About & philosophy',
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [({ req }) => expireTag(CACHE_TAGS.aboutPage, req)],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Philosophy',
          fields: [
            {
              name: 'statement',
              type: 'text',
              maxLength: 160,
              admin: { description: 'Opening statement: one clear, human sentence.' },
            },
            { name: 'introduction', type: 'richText', editor: publicRichTextEditor },
            {
              name: 'portrait',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Optional. Leave empty rather than using a stand-in.' },
            },
            {
              name: 'principles',
              type: 'array',
              maxRows: 4,
              admin: { description: 'Three or four short principles read best.' },
              fields: [
                { name: 'title', type: 'text', required: true, maxLength: 80 },
                { name: 'body', type: 'textarea', maxLength: 400 },
              ],
            },
            { name: 'currentFocus', type: 'textarea', maxLength: 400 },
          ],
        },
        {
          label: 'Credentials',
          fields: [
            {
              name: 'credentials',
              type: 'array',
              maxRows: 12,
              admin: {
                description: 'Shown in a side panel. Past expiry dates are labelled as expired.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'title', type: 'text', required: true, maxLength: 120 },
                    { name: 'issuer', type: 'text', maxLength: 80 },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'issuedOn',
                      type: 'date',
                      admin: { date: { pickerAppearance: 'monthOnly' } },
                    },
                    {
                      name: 'expiresOn',
                      type: 'date',
                      admin: { date: { pickerAppearance: 'monthOnly' } },
                    },
                  ],
                },
                {
                  name: 'url',
                  type: 'text',
                  validate: (value: string | null | undefined) => !value || safeHref(value),
                },
              ],
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              name: 'contact',
              type: 'group',
              admin: {
                description:
                  'Closing call to action on the home page and this page. Use links you are happy to publish.',
              },
              fields: [
                { name: 'heading', type: 'text', maxLength: 80 },
                { name: 'text', type: 'textarea', maxLength: 300 },
                {
                  name: 'links',
                  type: 'array',
                  maxRows: 6,
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'label', type: 'text', required: true, maxLength: 40 },
                        { name: 'href', type: 'text', required: true, validate: safeHref },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
