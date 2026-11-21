import { describe, expect, it } from 'vitest'

import { selectPerspective } from '@/lib/perspective'
import { isValidSlug, SLUG_MAX_LENGTH, toSlug } from '@/lib/validation/slugs'

describe('slugs', () => {
  it.each([
    ['Sample Project', 'sample-project'],
    ['  Sample   Project 2 ', 'sample-project-2'],
    ['Ünïcode: Café!', 'unicode-cafe'],
    ['---', ''],
  ])('toSlug(%j) -> %j', (input, slug) => expect(toSlug(input)).toBe(slug))

  it('never returns a slug over the limit or ending in a hyphen', () => {
    const slug = toSlug(`${'a'.repeat(SLUG_MAX_LENGTH - 1)} b`)
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH)
    expect(isValidSlug(slug)).toBe(true)
  })

  it.each(['sample', 'sample-project-2'])('accepts %s', (s) => expect(isValidSlug(s)).toBe(true))

  it.each(['', 'Sample', 'sample--x', '-sample', 'sample-', '../etc', 'a b', 'a'.repeat(81)])(
    'rejects %j',
    (s) => expect(isValidSlug(s)).toBe(false),
  )
})

describe('selectPerspective', () => {
  const both = { leadership: true, engineering: true }

  it('honours a valid, available request', () => {
    expect(selectPerspective('engineering', both)).toBe('engineering')
    expect(selectPerspective(['engineering', 'leadership'], both)).toBe('engineering')
  })

  it('defaults to leadership when nothing valid is requested', () => {
    expect(selectPerspective(undefined, both)).toBe('leadership')
    expect(selectPerspective('bogus', both)).toBe('leadership')
  })

  it('falls back to the narrative that exists', () => {
    const engineeringOnly = { leadership: false, engineering: true }
    expect(selectPerspective('leadership', engineeringOnly)).toBe('engineering')
  })

  it('returns null when neither narrative exists', () => {
    expect(selectPerspective('leadership', { leadership: false, engineering: false })).toBeNull()
  })
})
