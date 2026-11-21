import { randomBytes } from 'node:crypto'

import { getPayload } from 'payload'

import config from '../../src/payload.config'

/**
 * Prepares the isolated test database: applies migrations, clears content and
 * creates a throwaway editor whose random password exists only for this run.
 */
export default async function globalSetup(): Promise<void> {
  if (!/_test(\?|$)/.test(process.env.DATABASE_URI ?? '')) {
    throw new Error('e2e tests require a DATABASE_URI ending in "_test"')
  }

  const payload = await getPayload({ config: await config })
  await payload.db.migrate()
  await payload.delete({ collection: 'timeline-milestones', where: { id: { exists: true } } })
  await payload.delete({ collection: 'users', where: { id: { exists: true } } })
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { siteTitle: '', description: '', navLinks: [], sections: { journey: true } },
    context: { disableRevalidate: true },
  })

  const email = 'e2e-editor@example.test'
  const password = randomBytes(18).toString('base64url')
  await payload.create({ collection: 'users', data: { email, password, role: 'editor' } })

  // Values set here are inherited by the test workers.
  process.env.E2E_EDITOR_EMAIL = email
  process.env.E2E_EDITOR_PASSWORD = password

  await payload.destroy()
}
