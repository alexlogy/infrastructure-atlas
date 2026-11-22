import { describe, expect, it } from 'vitest'

import { credentialStatus } from '@/lib/credentials'
import { toAboutPageView } from '@/lib/payload/mappers'

describe('credentialStatus', () => {
  const now = new Date('2026-06-01T00:00:00Z')
  it('labels past expiry as expired, never as current', () => {
    expect(credentialStatus('2026-05-31T00:00:00Z', now)).toBe('expired')
    expect(credentialStatus('2027-01-01T00:00:00Z', now)).toBe('current')
    expect(credentialStatus(null, now)).toBe('no-expiry')
  })
})

describe('toAboutPageView', () => {
  it('is empty and hidden for a missing global', () => {
    const view = toAboutPageView(null)
    expect(view.hasContent).toBe(false)
    expect(view.principles).toEqual([])
    expect(view.contact).toEqual({ heading: null, text: null, links: [] })
  })

  it('drops blank principles, unsafe links and unsafe credential URLs', () => {
    const view = toAboutPageView({
      principles: [{ title: ' Sample principle ', body: '' }, { title: '  ' }],
      credentials: [
        { title: 'Sample credential', url: 'javascript:alert(1)' },
        { title: 'Sample credential 2', url: 'https://example.test/verify' },
      ],
      contact: {
        links: [
          { label: 'Email', href: 'mailto:owner@example.test' },
          { label: 'Bad', href: 'javascript:alert(1)' },
        ],
      },
    })
    expect(view.hasContent).toBe(true)
    expect(view.principles).toEqual([{ title: 'Sample principle', body: null }])
    expect(view.credentials.map((c) => c.url)).toEqual([null, 'https://example.test/verify'])
    expect(view.contact.links).toEqual([{ label: 'Email', href: 'mailto:owner@example.test' }])
  })
})
