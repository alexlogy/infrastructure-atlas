import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Achievements } from './collections/Achievements'
import { AtlasLocations } from './collections/AtlasLocations'
import { ImpactProjects } from './collections/ImpactProjects'
import { Media } from './collections/Media'
import { TimelineMilestones } from './collections/TimelineMilestones'
import { Users } from './collections/Users'
import { AboutPage } from './globals/AboutPage'
import { HomePage } from './globals/HomePage'
import { SiteSettings } from './globals/SiteSettings'
import { WritingSettings } from './globals/WritingSettings'
import { parseServerEnv } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const env = parseServerEnv(process.env)

export default buildConfig({
  admin: {
    user: Users.slug,
    // Built-in avatar: Gravatar would send a hash of each editor's email to a third party.
    avatar: 'default',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, TimelineMilestones, ImpactProjects, AtlasLocations, Achievements],
  globals: [SiteSettings, HomePage, AboutPage, WritingSettings],
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
    // Dev uses schema push; tests and production apply committed migrations (`pnpm migrate`).
    push: env.NODE_ENV === 'development' && env.PAYLOAD_DB_PUSH === 'true',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  // Upload size cap enforced by Payload's request parser (bytes).
  upload: { limits: { fileSize: 10 * 1024 * 1024 } },
  plugins: [],
})
