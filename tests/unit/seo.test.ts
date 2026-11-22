import { describe, expect, it } from 'vitest'

import { siteOrigin, sitemapEntries } from '@/lib/seo'

const on = { showJourney: true, showImpact: true, showAtlas: true }

describe('siteOrigin', () => {
  it('strips trailing slashes and has a local default', () => {
    expect(siteOrigin('https://example.test///')).toBe('https://example.test')
    expect(siteOrigin('')).toBe('http://localhost:3000')
    expect(siteOrigin(undefined)).toBe('http://localhost:3000')
  })
})

describe('sitemapEntries', () => {
  it('lists every enabled section and published project as absolute URLs', () => {
    const urls = sitemapEntries('https://example.test', {
      settings: on,
      projects: [{ slug: 'sample-project' }],
      showWriting: true,
      showAbout: true,
      showLab: true,
    }).map((e) => e.url)
    expect(urls).toEqual([
      'https://example.test/',
      'https://example.test/journey',
      'https://example.test/impact',
      'https://example.test/impact/sample-project',
      'https://example.test/atlas',
      'https://example.test/about',
      'https://example.test/lab',
      'https://example.test/writing',
    ])
  })

  it('leaves out disabled sections, their projects and Writing without Ghost', () => {
    const urls = sitemapEntries('https://example.test', {
      settings: { showJourney: false, showImpact: false, showAtlas: false },
      projects: [{ slug: 'sample-project' }],
      showWriting: false,
    }).map((e) => e.url)
    expect(urls).toEqual(['https://example.test/'])
  })
})
