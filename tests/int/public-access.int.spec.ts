import { randomBytes } from 'node:crypto'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// The CMS hooks call Next's revalidateTag; capture calls instead of needing a Next runtime.
const revalidateTag = vi.hoisted(() => vi.fn())
vi.mock('next/cache', () => ({ revalidateTag, unstable_cache: (fn: unknown) => fn }))

import config from '@/payload.config'
import {
  fetchHomePage,
  fetchPublicProject,
  fetchPublicProjects,
  fetchPublicTimeline,
  fetchSiteSettings,
} from '@/lib/payload/queries'
import { migrations } from '@/migrations'
import type { User } from '@/payload-types'

let payload: Payload
let editor: User

const password = () => randomBytes(18).toString('base64url')

const milestoneData = (title: string, status: 'draft' | 'published') => ({
  title,
  startDate: '2020-03-01T00:00:00.000Z',
  datePrecision: 'month' as const,
  _status: status,
})

beforeAll(async () => {
  // Safety net: this suite deletes data, so refuse to run against anything but a *_test database.
  if (!/_test(\?|$)/.test(process.env.DATABASE_URI ?? '')) {
    throw new Error('Integration tests require DATABASE_URI/TEST_DATABASE_URI ending in "_test"')
  }
  payload = await getPayload({ config: await config })
  // Pass migrations through Vite: Node's native TS loader cannot import the generated files.
  // Payload types migration args as `unknown`, so generated migrations need a cast.
  type Migrations = NonNullable<Parameters<Payload['db']['migrate']>[0]>['migrations']
  await payload.db.migrate({ migrations: migrations as unknown as Migrations })
  for (const collection of [
    'impact-projects',
    'atlas-locations',
    'timeline-milestones',
    'users',
  ] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }
})

afterAll(async () => {
  await payload?.destroy()
})

beforeEach(() => {
  revalidateTag.mockClear()
})

describe('users and roles', () => {
  it('forces the first account to admin, then honours the requested role', async () => {
    const first = await payload.create({
      collection: 'users',
      data: { email: 'first@example.test', password: password(), role: 'editor' },
    })
    expect(first.role).toBe('admin')

    editor = await payload.create({
      collection: 'users',
      data: { email: 'editor@example.test', password: password(), role: 'editor' },
    })
    expect(editor.role).toBe('editor')
  })

  it('stops an editor from promoting themselves', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: editor.id,
      data: { role: 'admin' },
      user: editor,
      overrideAccess: false,
    })
    expect(updated.role).toBe('editor')
  })

  it('hides users from anonymous readers and blocks anonymous sign-up', async () => {
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'anon@example.test', password: password(), role: 'editor' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})

describe('timeline milestones', () => {
  let draftId: number
  let publishedId: number

  it('keeps drafts out of every anonymous read path', async () => {
    draftId = (
      await payload.create({
        collection: 'timeline-milestones',
        data: milestoneData('Draft sample', 'draft'),
        draft: true,
      })
    ).id

    for (const draft of [false, true]) {
      const { docs } = await payload.find({
        collection: 'timeline-milestones',
        overrideAccess: false,
        draft,
      })
      expect(docs.map((d) => d.title)).not.toContain('Draft sample')
    }
    await expect(
      payload.findByID({ collection: 'timeline-milestones', id: draftId, overrideAccess: false }),
    ).rejects.toThrow()
    await expect(
      payload.findVersions({ collection: 'timeline-milestones', overrideAccess: false }),
    ).rejects.toThrow()
    expect((await fetchPublicTimeline(payload)).map((m) => m.title)).not.toContain('Draft sample')
  })

  it('lets an authenticated editor see drafts', async () => {
    const { docs } = await payload.find({
      collection: 'timeline-milestones',
      overrideAccess: false,
      user: editor,
      draft: true,
    })
    expect(docs.map((d) => d.title)).toContain('Draft sample')
  })

  it('does not revalidate on a draft-only save', async () => {
    await payload.update({
      collection: 'timeline-milestones',
      id: draftId,
      data: { subtitle: 'Still a draft' },
      draft: true,
    })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('publishes into the public timeline and expires the timeline cache', async () => {
    publishedId = (
      await payload.update({
        collection: 'timeline-milestones',
        id: draftId,
        data: { _status: 'published' },
      })
    ).id
    expect(revalidateTag).toHaveBeenCalledWith('timeline', { expire: 0 })

    const timeline = await fetchPublicTimeline(payload)
    expect(timeline).toHaveLength(1)
    expect(timeline[0]).toMatchObject({ title: 'Draft sample', subtitle: 'Still a draft' })
    // Only view-model fields reach the UI; no CMS bookkeeping fields.
    expect(Object.keys(timeline[0])).not.toEqual(
      expect.arrayContaining(['_status', 'createdAt', 'updatedAt']),
    )
  })

  it('removes unpublished milestones and expires the cache again', async () => {
    await payload.update({
      collection: 'timeline-milestones',
      id: publishedId,
      data: { _status: 'draft' },
    })
    expect(revalidateTag).toHaveBeenCalledWith('timeline', { expire: 0 })
    expect(await fetchPublicTimeline(payload)).toHaveLength(0)
  })

  it('revalidates when a published milestone is deleted', async () => {
    const doc = await payload.create({
      collection: 'timeline-milestones',
      data: milestoneData('Published sample', 'published'),
    })
    revalidateTag.mockClear()
    await payload.delete({ collection: 'timeline-milestones', id: doc.id })
    expect(revalidateTag).toHaveBeenCalledWith('timeline', { expire: 0 })
  })

  it('rejects anonymous writes and invalid date ranges', async () => {
    await expect(
      payload.create({
        collection: 'timeline-milestones',
        data: milestoneData('Anonymous', 'published'),
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'timeline-milestones',
        data: { ...milestoneData('Backwards', 'published'), endDate: '2019-01-01T00:00:00.000Z' },
      }),
    ).rejects.toThrow()
  })
})

describe('site settings', () => {
  it('is publicly readable, editor-writable and revalidates on save', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'site-settings',
        data: { siteTitle: 'Anonymous' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await payload.updateGlobal({
      slug: 'site-settings',
      data: { siteTitle: 'Sample Atlas', navLinks: [{ label: 'Docs', href: '/docs' }] },
      user: editor,
      overrideAccess: false,
    })
    expect(revalidateTag).toHaveBeenCalledWith('site-settings', { expire: 0 })
    expect((await fetchSiteSettings(payload)).siteTitle).toBe('Sample Atlas')

    await expect(
      payload.updateGlobal({
        slug: 'site-settings',
        data: { navLinks: [{ label: 'Bad', href: 'javascript:alert(1)' }] },
      }),
    ).rejects.toThrow()

    await payload.updateGlobal({
      slug: 'site-settings',
      data: { siteTitle: '', navLinks: [] },
    })
  })
})

describe('impact projects', () => {
  let projectId: number

  it('generates a slug from the title and keeps drafts out of public reads', async () => {
    const draft = await payload.create({
      collection: 'impact-projects',
      data: { title: 'Draft Sample Project', summary: 'Sample summary.', _status: 'draft' },
      draft: true,
    })
    projectId = draft.id
    expect(draft.slug).toBe('draft-sample-project')
    expect(revalidateTag).not.toHaveBeenCalled()

    expect(await fetchPublicProjects(payload)).toHaveLength(0)
    expect(await fetchPublicProject(payload, 'draft-sample-project')).toBeNull()
    await expect(
      payload.findByID({ collection: 'impact-projects', id: projectId, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('publishes into listings and detail, and expires the projects cache', async () => {
    await payload.update({
      collection: 'impact-projects',
      id: projectId,
      data: {
        _status: 'published',
        outcomes: [{ result: 'Sample qualitative result' }],
        sourceLinks: [{ label: 'Sample source', url: 'https://example.com/source' }],
      },
    })
    expect(revalidateTag).toHaveBeenCalledWith('projects', { expire: 0 })

    const list = await fetchPublicProjects(payload)
    expect(list.map((p) => p.slug)).toEqual(['draft-sample-project'])
    expect(Object.keys(list[0])).not.toEqual(expect.arrayContaining(['_status', 'createdAt']))

    const detail = await fetchPublicProject(payload, 'draft-sample-project')
    expect(detail?.outcomes).toEqual([
      { result: 'Sample qualitative result', metric: null, verification: null },
    ])
    expect(detail).not.toHaveProperty('milestones')
  })

  it('serves the last published version while a newer draft is pending', async () => {
    await payload.update({
      collection: 'impact-projects',
      id: projectId,
      data: { summary: 'Unpublished edit.' },
      draft: true,
    })
    expect((await fetchPublicProject(payload, 'draft-sample-project'))?.summary).toBe(
      'Sample summary.',
    )
  })

  it('rejects invalid or duplicate slugs and anonymous writes', async () => {
    const data = { title: 'Another', summary: 'x', _status: 'published' as const }
    await expect(
      payload.create({ collection: 'impact-projects', data: { ...data, slug: 'Bad Slug' } }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'impact-projects',
        data: { ...data, slug: 'draft-sample-project' },
      }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'impact-projects',
        data: { ...data, slug: 'anonymous' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    expect(await fetchPublicProject(payload, '../etc/passwd')).toBeNull()
  })
})

describe('atlas locations', () => {
  it('validates coordinates and hides drafts from anonymous readers', async () => {
    const base = {
      label: 'Sample city',
      latitude: 1.5,
      longitude: 103.8,
      precision: 'city' as const,
    }
    await expect(
      payload.create({ collection: 'atlas-locations', data: { ...base, latitude: 91 } }),
    ).rejects.toThrow()
    await expect(
      payload.create({ collection: 'atlas-locations', data: { ...base, longitude: -181 } }),
    ).rejects.toThrow()

    await payload.create({
      collection: 'atlas-locations',
      data: { ...base, _status: 'draft' },
      draft: true,
    })
    const { docs } = await payload.find({ collection: 'atlas-locations', overrideAccess: false })
    expect(docs).toHaveLength(0)
  })
})

describe('home page', () => {
  it('is editor-writable only, revalidates, and exposes featured ids in order', async () => {
    await expect(
      payload.updateGlobal({ slug: 'home-page', data: { headline: 'x' }, overrideAccess: false }),
    ).rejects.toThrow()

    const [project] = await fetchPublicProjects(payload)
    await payload.updateGlobal({
      slug: 'home-page',
      data: { headline: 'Sample headline', featuredProjects: [Number(project.id)] },
      user: editor,
      overrideAccess: false,
    })
    expect(revalidateTag).toHaveBeenCalledWith('home-page', { expire: 0 })

    const home = await fetchHomePage(payload)
    expect(home).toMatchObject({ headline: 'Sample headline', featuredProjectIds: [project.id] })

    await payload.updateGlobal({ slug: 'home-page', data: { headline: '', featuredProjects: [] } })
  })
})
