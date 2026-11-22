import { describe, expect, it } from 'vitest'

import { affectsPublishedContent } from '@/lib/cache/revalidate'
import {
  compareMilestones,
  compareProjects,
  DEFAULT_ATLAS_CENTER,
  DEFAULT_SITE_TITLE,
  type PublicLocationDoc,
  toAtlasView,
  type PublicMilestoneDoc,
  type PublicProjectDoc,
  toHomePageView,
  toImageView,
  toMilestoneView,
  toProjectSummaryView,
  toProjectView,
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
      contact: null,
      showJourney: true,
      showImpact: true,
      showAtlas: true,
      atlasCenter: DEFAULT_ATLAS_CENTER,
      shareImage: null,
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

  it('shows the contact button only for a safe link, with a default label', () => {
    expect(
      toSiteSettingsView({ contact: { label: '', href: 'mailto:owner@example.test' } }).contact,
    ).toEqual({ label: 'Get in touch', href: 'mailto:owner@example.test' })
    expect(toSiteSettingsView({ contact: { label: 'Say hi', href: '/about' } }).contact).toEqual({
      label: 'Say hi',
      href: '/about',
    })
    expect(
      toSiteSettingsView({ contact: { label: 'X', href: 'javascript:alert(1)' } }).contact,
    ).toBeNull()
    expect(toSiteSettingsView({ contact: { label: 'X', href: null } }).contact).toBeNull()
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

  it('makes Payload file URLs site-relative so next/image accepts them', () => {
    const url = (u: string) => toImageView({ id: 1, alt: 'x', url: u } as Media)?.url
    expect(url('http://localhost:3000/api/media/file/sample%20one.png')).toBe(
      '/api/media/file/sample%20one.png',
    )
    // Files served from elsewhere (e.g. a future storage adapter) are left alone.
    expect(url('https://cdn.example.test/sample.png')).toBe('https://cdn.example.test/sample.png')
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

const project = (overrides: Partial<PublicProjectDoc> = {}): PublicProjectDoc => ({
  id: 7,
  title: 'Sample project',
  slug: 'sample-project',
  summary: 'A sample summary.',
  ...overrides,
})

describe('toProjectView', () => {
  it('returns empty, renderable defaults for a minimal project', () => {
    expect(toProjectView(project())).toMatchObject({
      id: '7',
      slug: 'sample-project',
      image: null,
      tags: [],
      featured: false,
      sortOrder: 0,
      leadershipNarrative: null,
      engineeringNarrative: null,
      diagram: null,
      outcomes: [],
      sourceLinks: [],
    })
  })

  it('keeps quantified and qualitative outcomes distinct and drops empty ones', () => {
    const view = toProjectView(
      project({
        outcomes: [
          { result: 'Measured change', metric: ' 10% ', verification: 'Sample report' },
          { result: 'Qualitative change', metric: ' ', verification: '' },
          { result: '   ' },
        ],
      }),
    )
    expect(view.outcomes).toEqual([
      { result: 'Measured change', metric: '10%', verification: 'Sample report' },
      { result: 'Qualitative change', metric: null, verification: null },
    ])
  })

  it('drops unsafe source links', () => {
    const view = toProjectView(
      project({
        sourceLinks: [
          { label: 'Report', url: 'https://example.com/report' },
          { label: 'Bad', url: 'javascript:alert(1)' },
        ],
      }),
    )
    expect(view.sourceLinks).toEqual([{ label: 'Report', href: 'https://example.com/report' }])
  })
})

describe('compareProjects', () => {
  it('orders by sortOrder, then title', () => {
    const views = [
      project({ id: 1, title: 'B', sortOrder: 1 }),
      project({ id: 2, title: 'C', sortOrder: 0 }),
      project({ id: 3, title: 'A', sortOrder: 1 }),
    ].map(toProjectSummaryView)
    expect(views.sort(compareProjects).map((v) => v.title)).toEqual(['C', 'A', 'B'])
  })
})

describe('toHomePageView', () => {
  it('returns empty defaults for a missing global', () => {
    expect(toHomePageView(null)).toEqual({
      headline: null,
      subheadline: null,
      heroImage: null,
      callsToAction: [],
      featuredProjectIds: [],
    })
  })

  it('keeps featured order for ids and populated docs, and filters unsafe actions', () => {
    const view = toHomePageView({
      headline: ' Sample headline ',
      featuredProjects: [3, { ...project({ id: 1 }), createdAt: '', updatedAt: '' }],
      callsToAction: [
        { label: 'Impact', href: '/impact' },
        { label: 'Bad', href: 'javascript:alert(1)' },
      ],
    })
    expect(view.headline).toBe('Sample headline')
    expect(view.featuredProjectIds).toEqual(['3', '1'])
    expect(view.callsToAction).toEqual([{ label: 'Impact', href: '/impact' }])
  })
})

const location = (id: number, overrides: Partial<PublicLocationDoc> = {}): PublicLocationDoc => ({
  id,
  label: `Sample place ${id}`,
  latitude: id,
  longitude: id * 10,
  precision: 'city',
  ...overrides,
})

describe('toAtlasView', () => {
  it('orders nodes and joins the place parts that exist', () => {
    const { nodes } = toAtlasView(
      [
        location(1, { sortOrder: 2 }),
        location(2, { sortOrder: 1, city: ' Sample City ', country: 'Sample Country', region: '' }),
      ],
      [],
      [],
    )
    expect(nodes.map((n) => n.id)).toEqual(['2', '1'])
    expect(nodes[0].place).toBe('Sample City, Sample Country')
    expect(nodes[1].place).toBeNull()
  })

  it('attaches stories and builds de-duplicated arcs between published nodes only', () => {
    const view = toAtlasView(
      [location(1), location(2), location(3)],
      [
        { id: 10, title: 'Project A', slug: 'project-a', locations: [1, { id: 2 }, 99, 3] },
        { id: 11, title: 'Project B', slug: 'project-b', locations: [2, 1] },
      ],
      [
        { id: 20, title: 'Milestone A', location: 3 },
        { id: 21, title: 'Milestone on a draft place', location: 99 },
      ],
    )
    expect(view.arcs).toEqual([
      { from: '1', to: '2' },
      { from: '2', to: '3' },
    ])
    const third = view.nodes.find((n) => n.id === '3')!
    expect(third.stories).toEqual([
      { kind: 'project', title: 'Project A', href: '/impact/project-a' },
      { kind: 'milestone', title: 'Milestone A', href: '/journey#milestone-20' },
    ])
    expect(view.nodes.flatMap((n) => n.stories).map((s) => s.title)).not.toContain(
      'Milestone on a draft place',
    )
  })

  it('skips locations with unusable coordinates', () => {
    expect(toAtlasView([location(1, { latitude: Number.NaN })], [], []).nodes).toEqual([])
  })
})

describe('toSiteSettingsView atlas fields', () => {
  it('uses the configured starting view and visibility toggle', () => {
    const view = toSiteSettingsView({
      sections: { atlas: false },
      atlasCenter: { latitude: -20, longitude: 140 },
    })
    expect(view.showAtlas).toBe(false)
    expect(view.atlasCenter).toEqual({ latitude: -20, longitude: 140 })
  })
})
