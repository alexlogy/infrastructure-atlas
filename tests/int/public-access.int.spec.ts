import { randomBytes } from 'node:crypto'

import sharp from 'sharp'

import { type Field, getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// The CMS hooks call Next's revalidateTag; capture calls instead of needing a Next runtime.
const revalidateTag = vi.hoisted(() => vi.fn())
vi.mock('next/cache', () => ({ revalidateTag, unstable_cache: (fn: unknown) => fn }))

import config from '@/payload.config'
import {
  fetchAtlas,
  fetchPublicAchievements,
  fetchHomePage,
  fetchPublicProject,
  fetchPublicProjects,
  fetchPublicTimeline,
  fetchSiteSettings,
  fetchWritingSettings,
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
    'achievements',
    'impact-projects',
    'atlas-locations',
    'timeline-milestones',
    'media',
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

  it('locks an account after 5 failed logins, even for the right password', async () => {
    const secret = password()
    const email = 'lockout@example.test'
    await payload.create({ collection: 'users', data: { email, password: secret, role: 'editor' } })
    const login = (pw: string) =>
      payload.login({ collection: 'users', data: { email, password: pw } })

    for (let i = 0; i < 5; i++) await expect(login('wrong-password')).rejects.toThrow()
    await expect(login(secret)).rejects.toThrow(/locked/i)
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
    // Preview path: the same public query, run as the editor, includes drafts.
    expect((await fetchPublicTimeline(payload, editor)).map((m) => m.title)).toContain(
      'Draft sample',
    )
  })

  it('skips incomplete drafts in preview instead of failing', async () => {
    const incomplete = await payload.create({
      collection: 'timeline-milestones',
      data: { title: 'Incomplete draft', _status: 'draft' },
      draft: true,
    })
    const titles = (await fetchPublicTimeline(payload, editor)).map((m) => m.title)
    expect(titles).not.toContain('Incomplete draft')
    await payload.delete({ collection: 'timeline-milestones', id: incomplete.id })
    revalidateTag.mockClear()
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
    // An editor previewing sees the pending draft.
    expect((await fetchPublicProject(payload, 'draft-sample-project', editor))?.summary).toBe(
      'Unpublished edit.',
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

describe('achievements', () => {
  it('shows only published figures, in order, and expires the cache on publish', async () => {
    const draft = await payload.create({
      collection: 'achievements',
      data: { value: '1', label: 'Sample draft figure', _status: 'draft' },
      draft: true,
    })
    expect(await fetchPublicAchievements(payload)).toEqual([])
    const anon = await payload.find({ collection: 'achievements', overrideAccess: false })
    expect(anon.docs).toHaveLength(0)

    revalidateTag.mockClear()
    await payload.create({
      collection: 'achievements',
      data: { value: '2', label: 'Sample second', sortOrder: 2, _status: 'published' },
    })
    await payload.create({
      collection: 'achievements',
      data: { value: '1', unit: '+', label: 'Sample first', sortOrder: 1, _status: 'published' },
    })
    expect(revalidateTag).toHaveBeenCalledWith('achievements', expect.anything())
    expect((await fetchPublicAchievements(payload)).map((a) => a.label)).toEqual([
      'Sample first',
      'Sample second',
    ])
    await payload.delete({ collection: 'achievements', id: draft.id })
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

describe('atlas', () => {
  it('shows only published places, stories and arcs, and expires the atlas cache', async () => {
    const place = (label: string, latitude: number, longitude: number) => ({
      label,
      latitude,
      longitude,
      precision: 'city' as const,
    })
    const published = await Promise.all([
      payload.create({
        collection: 'atlas-locations',
        data: { ...place('Atlas sample A', 1, 100), _status: 'published' },
      }),
      payload.create({
        collection: 'atlas-locations',
        data: { ...place('Atlas sample B', -30, 150), _status: 'published' },
      }),
    ])
    expect(revalidateTag).toHaveBeenCalledWith('atlas', { expire: 0 })
    const draft = await payload.create({
      collection: 'atlas-locations',
      data: { ...place('Atlas draft place', 40, 10), _status: 'draft' },
      draft: true,
    })

    await payload.create({
      collection: 'impact-projects',
      data: {
        title: 'Atlas sample project',
        slug: 'atlas-sample-project',
        summary: 'Sample.',
        locations: [published[0].id, draft.id, published[1].id],
        _status: 'published',
      },
    })
    await payload.create({
      collection: 'timeline-milestones',
      data: { ...milestoneData('Atlas sample milestone', 'published'), location: draft.id },
    })

    const atlas = await fetchAtlas(payload)
    expect(atlas.nodes.map((n) => n.label).sort()).toEqual(['Atlas sample A', 'Atlas sample B'])
    expect(atlas.arcs).toHaveLength(1)
    const stories = atlas.nodes.flatMap((n) => n.stories.map((s) => s.title))
    expect(stories).toEqual(['Atlas sample project', 'Atlas sample project'])
    expect(JSON.stringify(atlas)).not.toContain('Atlas draft place')
  })
})

describe('writing settings', () => {
  it('is editor-writable only, validates Ghost slugs and expires its cache', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'writing-settings',
        data: { recentCount: 3 },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.updateGlobal({
        slug: 'writing-settings',
        data: { recentCount: 3, featuredSlugs: ['ok', 'bad]+slug:x'] },
      }),
    ).rejects.toThrow()
    await expect(
      payload.updateGlobal({ slug: 'writing-settings', data: { recentCount: 50 } }),
    ).rejects.toThrow()

    await payload.updateGlobal({
      slug: 'writing-settings',
      data: { enabled: true, recentCount: 4, excludeTags: ['sample-tag'], featuredSlugs: ['a'] },
      user: editor,
      overrideAccess: false,
    })
    expect(revalidateTag).toHaveBeenCalledWith('writing-settings', { expire: 0 })
    expect(await fetchWritingSettings(payload)).toEqual({
      enabled: true,
      recentCount: 4,
      includeTags: [],
      excludeTags: ['sample-tag'],
      featuredSlugs: ['a'],
    })
  })
})

describe('media', () => {
  const upload = async (name: string) => {
    const data = await sharp({
      create: { width: 4, height: 4, channels: 3, background: '#13273a' },
    })
      .png()
      .toBuffer()
    return payload.create({
      collection: 'media',
      data: { alt: `Sample image ${name}` },
      file: { data, mimetype: 'image/png', name: `sample-${name}.png`, size: data.length },
    })
  }
  const anonymousIds = async () =>
    (await payload.find({ collection: 'media', overrideAccess: false, depth: 0 })).docs.map(
      (d) => d.id,
    )

  it('is public only while published content uses it', async () => {
    const [shown, draftOnly, unused, pending] = await Promise.all(
      ['shown', 'draft-only', 'unused', 'pending'].map(upload),
    )
    const published = await payload.create({
      collection: 'timeline-milestones',
      data: { ...milestoneData('Sample milestone with image', 'published'), image: shown.id },
    })
    await payload.create({
      collection: 'timeline-milestones',
      data: { ...milestoneData('Sample draft with image', 'draft'), image: draftOnly.id },
    })
    // A pending draft swaps the image; the published version still uses the old one.
    await payload.update({
      collection: 'timeline-milestones',
      id: published.id,
      data: { image: pending.id },
      draft: true,
    })

    expect(await anonymousIds()).toEqual([shown.id])
    const timeline = await fetchPublicTimeline(payload)
    expect(timeline.find((m) => m.id === String(published.id))?.image?.url).toContain(
      'sample-shown',
    )

    const all = await payload.find({ collection: 'media', user: editor, overrideAccess: false })
    expect(all.docs.map((d) => d.id).sort()).toEqual(
      [shown.id, draftOnly.id, unused.id, pending.id].sort(),
    )

    await payload.update({
      collection: 'timeline-milestones',
      id: published.id,
      data: { _status: 'draft' },
    })
    expect(await anonymousIds()).toEqual([])
  })

  it('covers every field that references media', () => {
    // If this fails, add the new field to src/access/publishedMedia.ts, then update this list.
    const found: string[] = []
    const walk = (owner: string, fields: Field[]) => {
      for (const field of fields) {
        if (
          (field.type === 'upload' || field.type === 'relationship') &&
          [field.relationTo].flat().includes('media')
        ) {
          found.push(`${owner}.${field.name}`)
        }
        if ('fields' in field) walk(owner, field.fields)
        if (field.type === 'tabs') field.tabs.forEach((tab) => walk(owner, tab.fields))
        if (field.type === 'blocks') field.blocks.forEach((b) => walk(owner, b.fields))
      }
    }
    // payload-* collections are Payload internals (locks, preferences, migrations), never public.
    for (const c of payload.config.collections)
      if (!c.slug.startsWith('payload-')) walk(c.slug, c.fields)
    for (const g of payload.config.globals) walk(g.slug, g.fields)
    expect(found.sort()).toEqual([
      'home-page.heroImage',
      'impact-projects.diagram',
      'impact-projects.featuredImage',
      'site-settings.shareImage',
      'timeline-milestones.image',
    ])
  })
})
