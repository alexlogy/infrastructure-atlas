import type { CollectionConfig } from 'payload'

import { adminOnly, adminOnlyField, adminOrSelf, canAccessAdmin } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role'],
  },
  // No public sign-up: only admins create accounts. Payload's one-time
  // "create first user" screen works only while the collection is empty.
  auth: {
    // Per-account brute-force lockout. Per-IP throttling belongs at the reverse proxy (docs/deployment.md).
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: {
      // Payload defaults to a non-Secure cookie; never send the session over plain http in production.
      secure: (process.env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('https://'),
      sameSite: 'Lax',
    },
  },
  access: {
    admin: canAccessAdmin,
    create: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // The very first account must be able to administer the site.
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) return { ...data, role: 'admin' }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      // Editors cannot promote themselves; only admins change roles.
      access: {
        create: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        description: 'Admins manage users and settings. Editors manage content.',
      },
    },
  ],
}
