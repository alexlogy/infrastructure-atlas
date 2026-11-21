import { describe, expect, it } from 'vitest'

import { affectsPublishedContent } from '@/lib/cache/revalidate'
import {
  compareMilestones,
  DEFAULT_SITE_TITLE,
  type PublicMilestoneDoc,
  toImageView,
  toMilestoneView,
  toSiteSettingsView,
} from '@/lib/payload/mappers'
import type { Media } from '@/payload-types'

const milestone = (overrides: Partial<PublicMilestoneDoc> = {}): PublicMilestoneDoc => ({
  id: 1,
  title: 'Sample milestone',
  startDate: '2020-03-01T00:00:00.000Z',
  datePrecision: 'month',
  ...overrides,
})

describe('toSiteSettingsView', () => {
  it('returns neutral defaults for an empty or missing global', () => {
    expect(toSiteSettingsView(null)).toEqual({
      siteTitle: DEFAULT_SITE_TITLE,
      description: null,
      locale: 'en',
      navLinks: [],
      showJourney: true,
    })
    expect(toSiteSettingsView({ siteTitle: '   ', description: '' }).siteTitle).toBe(
      DEFAULT_SITE_TITLE,
    )
  })

  it('drops unsafe or unlabeled nav links that predate validation', () => {
    const view = toSiteSettingsView({
      navLinks: [
        { label: 'Docs', href: 'https://example.com/docs' },
        { label: 'Bad', href: 'javascript:alert(1)' },
        { label: '  ', href: '/journey' },
      ],
    })
    expect(view.navLinks).toEqual([{ label: 'Docs', href: 'https://example.com/docs' }])
  })

  it('honours the journey visibility toggle', () => {
    expect(toSiteSettingsView({ sections: { journey: false } }).showJourney).toBe(false)
  })
})

describe('toImageView', () => {
  it('ignores unpopulated ids and files without a URL', () => {
    expect(toImageView(5)).toBeNull()
    expect(toImageView(null)).toBeNull()
    expect(toImageView({ id: 1, alt: 'x' } as Media)).toBeNull()
  })

  it('keeps only public display fields', () => {
    const media = {
      id: 1,
      alt: 'A sample image',
      url: '/api/media/file/sample.png',
      width: 800,
      height: 600,
      attribution: ' ',
      filename: 'sample.png',
      filesize: 1234,
      createdAt: '',
      updatedAt: '',
    } as Media
    expect(toImageView(media)).toEqual({
      url: '/api/media/file/sample.png',
      alt: 'A sample image',
      width: 800,
      height: 600,
      attribution: null,
    })
  })
})

describe('toMilestoneView', () => {
  it('normalises optional fields', () => {
    const view = toMilestoneView(
      milestone({ subtitle: '  ', era: ' Early ', tags: ['a', ' ', ' b '], featured: null }),
    )
    expect(view).toMatchObject({
      id: '1',
      subtitle: null,
      era: 'Early',
      tags: ['a', 'b'],
      featured: false,
      sortOrder: 0,
      endDate: null,
      image: null,
      description: null,
    })
  })
})

describe('compareMilestones', () => {
  it('orders by start date, then sortOrder, then title', () => {
    const views = [
      milestone({ id: 1, title: 'C', startDate: '2021-01-01T00:00:00.000Z' }),
      milestone({ id: 2, title: 'B', startDate: '2020-01-01T00:00:00.000Z', sortOrder: 2 }),
      milestone({ id: 3, title: 'A', startDate: '2020-01-01T00:00:00.000Z', sortOrder: 1 }),
      milestone({ id: 4, title: 'Z', startDate: '2020-01-01T00:00:00.000Z', sortOrder: 1 }),
    ].map(toMilestoneView)
    expect(views.sort(compareMilestones).map((v) => v.title)).toEqual(['A', 'Z', 'B', 'C'])
  })
})

describe('affectsPublishedContent', () => {
  it('is true when publishing, unpublishing or editing published content', () => {
    expect(affectsPublishedContent({ _status: 'published' }, { _status: 'draft' })).toBe(true)
    expect(affectsPublishedContent({ _status: 'draft' }, { _status: 'published' })).toBe(true)
    expect(affectsPublishedContent({ _status: 'published' }, { _status: 'published' })).toBe(true)
  })

  it('is false for draft-only saves', () => {
    expect(affectsPublishedContent({ _status: 'draft' }, { _status: 'draft' })).toBe(false)
    expect(affectsPublishedContent({ _status: 'draft' })).toBe(false)
  })
})
