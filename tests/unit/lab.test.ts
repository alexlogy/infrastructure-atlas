import { describe, expect, it } from 'vitest'

import { labTags, leadLabProject } from '@/lib/lab'
import { pickTag } from '@/lib/tags'
import { toLabProjectView } from '@/lib/payload/mappers'
import type { LabProjectView } from '@/types/view-models'

const lab = (id: number, tags: string[], featured = false): LabProjectView => ({
  id: String(id),
  title: `Sample experiment ${id}`,
  category: null,
  status: 'active',
  summary: 'Fictional.',
  tags,
  image: null,
  link: null,
  featured,
})

describe('lab helpers', () => {
  const all = [lab(1, ['b', 'a']), lab(2, ['a'], true), lab(3, [])]

  it('leads with the first featured entry, else the first', () => {
    expect(leadLabProject(all)?.id).toBe('2')
    expect(leadLabProject([lab(5, [])])?.id).toBe('5')
    expect(leadLabProject([])).toBeNull()
  })

  it('lists tags A–Z and accepts only tags in use', () => {
    const tags = labTags(all)
    expect(tags).toEqual(['a', 'b'])
    expect(pickTag(tags, 'b')).toBe('b')
    expect(pickTag(tags, ['a', 'b'])).toBe('a')
    expect(pickTag(tags, 'missing')).toBeNull()
    expect(pickTag(tags, undefined)).toBeNull()
  })
})

describe('toLabProjectView', () => {
  it('keeps only safe links, with a default label, and a known status', () => {
    const base = { id: 1, title: 'Sample', summary: 'Fictional.', category: ' ', tags: [] }
    expect(toLabProjectView({ ...base, link: { href: 'https://example.test/repo' } }).link).toEqual(
      { label: 'Read more', href: 'https://example.test/repo' },
    )
    expect(toLabProjectView({ ...base, link: { href: 'javascript:alert(1)' } }).link).toBeNull()
    expect(toLabProjectView({ ...base, stage: 'nope' as never }).status).toBe('active')
    expect(toLabProjectView(base).category).toBeNull()
  })
})
