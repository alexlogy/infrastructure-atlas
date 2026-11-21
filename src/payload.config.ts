import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { TimelineMilestones } from './collections/TimelineMilestones'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'
import { parseServerEnv } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const env = parseServerEnv(process.env)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, TimelineMilestones],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  serverURL: env.NEXT_PUBLIC_SITE_URL,
  // GraphQL is unused by this project; disabling it removes an exposed API surface.
  graphQL: { disable: true },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URI,
    },
    // Dev uses schema push; production applies committed migrations (`pnpm migrate`).
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  // Upload size cap enforced by Payload's request parser (bytes).
  upload: { limits: { fileSize: 10 * 1024 * 1024 } },
  plugins: [],
})
