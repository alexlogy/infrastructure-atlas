import { describe, expect, it } from 'vitest'

import { isActive } from '@/components/layout/HeaderNav'

describe('isActive', () => {
  it('marks a section active on its page and its children only', () => {
    expect(isActive('/impact', '/impact')).toBe(true)
    expect(isActive('/impact/sample-project', '/impact')).toBe(true)
    expect(isActive('/impactful', '/impact')).toBe(false)
    expect(isActive('/journey', '/')).toBe(false)
    expect(isActive('/', '/')).toBe(true)
    expect(isActive('/about', 'https://example.test/about')).toBe(false)
  })
})
