import { describe, expect, it } from 'vitest'

import { pickTag } from '@/lib/tags'
import { arrangePosts, postTags } from '@/lib/writing'
import type { GhostPostView } from '@/types/view-models'

const post = (id: string, tags: string[] = []): GhostPostView => ({
  id,
  title: `Sample article ${id}`,
  slug: `sample-${id}`,
  url: `https://blog.example.test/sample-${id}/`,
  excerpt: null,
  image: null,
  tags,
  publishedAt: '2026-01-01T00:00:00.000Z',
  readingTime: null,
})

describe('arrangePosts', () => {
  it('leads with the first featured post and lists the rest without repeats', () => {
    const { lead, rest } = arrangePosts([post('1'), post('2')], [post('3'), post('2')], null)
    expect(lead?.id).toBe('1')
    expect(rest.map((p) => p.id)).toEqual(['2', '3'])
  })

  it('falls back to the newest recent post when nothing is featured', () => {
    expect(arrangePosts([], [post('3'), post('4')], null).lead?.id).toBe('3')
    expect(arrangePosts([], [], null)).toEqual({ lead: null, rest: [] })
  })

  it('with a tag, lists only matching posts and nothing leads', () => {
    const { lead, rest } = arrangePosts(
      [post('1', ['a'])],
      [post('2', ['b']), post('3', ['a'])],
      'a',
    )
    expect(lead).toBeNull()
    expect(rest.map((p) => p.id)).toEqual(['1', '3'])
  })
})

describe('tags', () => {
  it('lists tags A–Z and accepts only those in use', () => {
    const tags = postTags([post('1', ['b', 'a']), post('2', ['a'])])
    expect(tags).toEqual(['a', 'b'])
    expect(pickTag(tags, 'b')).toBe('b')
    expect(pickTag(tags, 'zzz')).toBeNull()
  })
})
