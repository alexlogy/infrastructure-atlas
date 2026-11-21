import { describe, expect, it, vi } from 'vitest'

import {
  buildPostsUrl,
  fetchPosts,
  GhostRequestError,
  type PostQuery,
  withLastKnownGood,
} from '@/lib/ghost/client'

const config = { url: 'https://blog.example.test', key: 'sample-content-key' }
const recent: PostQuery = { kind: 'recent', limit: 3, includeTags: [], excludeTags: [], skip: [] }

const post = (slug: string, overrides: Record<string, unknown> = {}) => ({
  id: `id-${slug}`,
  title: `Sample ${slug}`,
  slug,
  url: `https://blog.example.test/${slug}/`,
  excerpt: 'Generated excerpt.',
  published_at: '2024-05-01T10:00:00.000+00:00',
  reading_time: 4,
  tags: [
    { name: 'Public tag', slug: 'public-tag', visibility: 'public' },
    { name: '#internal', slug: 'hash-internal', visibility: 'internal' },
  ],
  ...overrides,
})

const respond = (body: unknown, status = 200) =>
  vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))

describe('buildPostsUrl', () => {
  it('requests only card fields, with tags, newest first', () => {
    const url = buildPostsUrl(config, recent)
    expect(url.pathname).toBe('/ghost/api/content/posts/')
    expect(url.searchParams.get('limit')).toBe('3')
    expect(url.searchParams.get('include')).toBe('tags')
    expect(url.searchParams.get('fields')).not.toContain('html')
    expect(url.searchParams.get('order')).toBe('published_at desc')
    expect(url.searchParams.has('filter')).toBe(false)
  })

  it('keeps a sub-path install and caps the limit', () => {
    const url = buildPostsUrl(
      { ...config, url: 'https://example.test/blog' },
      {
        ...recent,
        limit: 500,
      },
    )
    expect(url.pathname).toBe('/blog/ghost/api/content/posts/')
    expect(url.searchParams.get('limit')).toBe('20')
  })

  it('builds tag and featured filters from valid slugs only', () => {
    const url = buildPostsUrl(config, {
      ...recent,
      includeTags: ['infra', 'bad]+slug:x'],
      excludeTags: ['drafts'],
      skip: ['featured-one'],
    })
    expect(url.searchParams.get('filter')).toBe('tag:[infra]+tag:-[drafts]+slug:-[featured-one]')

    const featured = buildPostsUrl(config, { kind: 'featured', slugs: ['a', 'b'] })
    expect(featured.searchParams.get('filter')).toBe('slug:[a,b]')
    expect(featured.searchParams.get('limit')).toBe('2')
  })
})

describe('fetchPosts', () => {
  it('maps posts to minimal view models and drops invalid ones', async () => {
    const fetchImpl = respond({
      posts: [
        post('one', {
          canonical_url: 'https://canonical.example.test/one',
          custom_excerpt: '  Custom   excerpt ',
          feature_image: 'https://blog.example.test/img.jpg',
          feature_image_alt: 'Sample image',
          html: '<p>should never be used</p>',
        }),
        post('two', { url: 'javascript:alert(1)' }),
        post('three', { title: '   ' }),
        post('four', { feature_image: 'data:image/png;base64,xx', canonical_url: 'ftp://x' }),
      ],
      meta: { pagination: { page: 1, pages: 3 } },
    })

    const posts = await fetchPosts(config, recent, fetchImpl)
    expect(posts.map((p) => p.slug)).toEqual(['one', 'four'])
    expect(posts[0]).toEqual({
      id: 'id-one',
      title: 'Sample one',
      slug: 'one',
      url: 'https://canonical.example.test/one',
      excerpt: 'Custom excerpt',
      image: { url: 'https://blog.example.test/img.jpg', alt: 'Sample image' },
      tags: ['Public tag'],
      publishedAt: '2024-05-01T10:00:00.000+00:00',
      readingTime: 4,
    })
    expect(posts[1]).toMatchObject({ url: 'https://blog.example.test/four/', image: null })
  })

  it('returns featured posts in the requested order and skips missing slugs', async () => {
    const fetchImpl = respond({ posts: [post('b'), post('a')] })
    const posts = await fetchPosts(
      config,
      { kind: 'featured', slugs: ['a', 'renamed', 'b'] },
      fetchImpl,
    )
    expect(posts.map((p) => p.slug)).toEqual(['a', 'b'])
  })

  it('makes no request when there are no valid featured slugs', async () => {
    const fetchImpl = respond({ posts: [] })
    expect(await fetchPosts(config, { kind: 'featured', slugs: [] }, fetchImpl)).toEqual([])
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it.each([
    ['HTTP errors', respond({ errors: [] }, 429), 'HTTP 429'],
    ['bad JSON shapes', respond({ nope: true }), 'unexpected response shape'],
    [
      'timeouts',
      vi.fn<typeof fetch>(async () => {
        throw Object.assign(new Error('aborted'), { name: 'TimeoutError' })
      }),
      'timeout',
    ],
  ])('throws a key-free error for %s', async (_, fetchImpl, reason) => {
    const error = await fetchPosts(config, recent, fetchImpl).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(GhostRequestError)
    expect((error as Error).message).toContain(reason)
    expect((error as Error).message).not.toContain(config.key)
  })
})

describe('withLastKnownGood', () => {
  it('falls back to the last good result, then to an empty state, without logging the key', async () => {
    const log = vi.fn()
    let fail = false
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      fail
        ? new Response('down', { status: 503 })
        : new Response(JSON.stringify({ posts: [post('one')] })),
    )
    const read = withLastKnownGood((q: PostQuery) => fetchPosts(config, q, fetchImpl), [], log)

    expect(await read(recent)).toMatchObject({ status: 'ok', value: [{ slug: 'one' }] })
    fail = true
    expect(await read(recent)).toMatchObject({ status: 'stale', value: [{ slug: 'one' }] })
    expect(await read({ ...recent, limit: 9 })).toEqual({ status: 'unavailable', value: [] })
    expect(log).toHaveBeenCalledWith('[ghost] Ghost request failed: HTTP 503')
    expect(JSON.stringify(log.mock.calls)).not.toContain(config.key)
  })
})
