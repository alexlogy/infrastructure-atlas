import { describe, expect, it } from 'vitest'

import { DEFAULT_MARKER, markerKey, markerStyleFor } from '@/lib/atlas-markers'

describe('markerKey', () => {
  it('keeps uncategorised places on the default style and orders categories A–Z', () => {
    const key = markerKey(['Sample office', null, 'Sample event', 'Sample office'])
    expect(key).toEqual([
      { category: null, shape: 'circle', color: 'accent' },
      { category: 'Sample event', shape: 'diamond', color: 'ice' },
      { category: 'Sample office', shape: 'square', color: 'accent' },
    ])
  })

  it('gives a category the same style whether or not uncategorised places exist', () => {
    expect(markerKey(['Sample event'])).toEqual([
      { category: 'Sample event', shape: 'diamond', color: 'ice' },
    ])
  })

  it('varies shape and colour together, and only repeats after seven categories', () => {
    const key = markerKey(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
    const styles = key.map(({ shape, color }) => `${shape}/${color}`)
    expect(styles.slice(0, 3)).toEqual(['diamond/ice', 'square/accent', 'triangle/ice'])
    // Seven categories plus the default use all eight pairs.
    expect(new Set([...styles.slice(0, 7), 'circle/accent']).size).toBe(8)
    expect(styles[7]).toBe('circle/accent')
  })
})

describe('markerStyleFor', () => {
  it('looks up a category, falling back to the default', () => {
    const key = markerKey(['Sample event', null])
    expect(markerStyleFor(key, 'Sample event').shape).toBe('diamond')
    expect(markerStyleFor(key, null)).toEqual(DEFAULT_MARKER)
    expect(markerStyleFor(key, 'Unknown')).toEqual(DEFAULT_MARKER)
  })
})
