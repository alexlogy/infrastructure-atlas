import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '@/access'

/**
 * Places shown on the atlas. Coordinates are public once published, so editors
 * are reminded to use city-level points rather than private sites.
 * Visibility is controlled by draft/publish rather than a separate toggle.
 */
export const AtlasLocations: CollectionConfig = {
  slug: 'atlas-locations',
  labels: { singular: 'Atlas location', plural: 'Atlas locations' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'country', 'precision', '_status'],
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
  fields: [
    { name: 'label', type: 'text', required: true, maxLength: 80 },
    {
      type: 'row',
      fields: [
        { name: 'city', type: 'text', maxLength: 80 },
        { name: 'region', type: 'text', maxLength: 80 },
        { name: 'country', type: 'text', maxLength: 80 },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'latitude',
          type: 'number',
          required: true,
          min: -90,
          max: 90,
          admin: {
            description:
              'Published coordinates are public. Use a city centre, never a private office or infrastructure site.',
          },
        },
        { name: 'longitude', type: 'number', required: true, min: -180, max: 180 },
        {
          name: 'precision',
          type: 'select',
          required: true,
          defaultValue: 'city',
          options: [
            { label: 'Exact', value: 'exact' },
            { label: 'City', value: 'city' },
            { label: 'Region', value: 'region' },
            { label: 'Country', value: 'country' },
          ],
        },
      ],
    },
    {
      name: 'category',
      type: 'text',
      maxLength: 40,
      admin: { description: 'Optional grouping used for the atlas marker style.' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower values are listed first.' },
    },
  ],
}
