import { createHmac } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { SIGNATURE_TOLERANCE_MS, verifyGhostSignature } from '@/lib/ghost/webhook'

const SECRET = 'sample-webhook-secret-for-unit-tests-only'
const BODY = JSON.stringify({ post: { current: { slug: 'sample-article' } } })
const NOW = 1_800_000_000_000

/** Mirrors Ghost's webhook-trigger.js signing. */
const sign = (body: string, ts: number, secret = SECRET) =>
  `sha256=${createHmac('sha256', secret).update(`${body}${ts}`).digest('hex')}, t=${ts}`

describe('verifyGhostSignature', () => {
  it('accepts a fresh signature over the exact body', () => {
    expect(verifyGhostSignature(sign(BODY, NOW), BODY, SECRET, NOW)).toBe(true)
    expect(verifyGhostSignature(sign(BODY, NOW - 60_000), BODY, SECRET, NOW)).toBe(true)
  })

  it('rejects a wrong secret or a modified body', () => {
    expect(verifyGhostSignature(sign(BODY, NOW, 'another-secret'), BODY, SECRET, NOW)).toBe(false)
    expect(verifyGhostSignature(sign(BODY, NOW), `${BODY} `, SECRET, NOW)).toBe(false)
  })

  it('rejects a timestamp moved after signing', () => {
    const forged = sign(BODY, NOW).replace(`t=${NOW}`, `t=${NOW + 1}`)
    expect(verifyGhostSignature(forged, BODY, SECRET, NOW)).toBe(false)
  })

  it('rejects replays outside the tolerance window, in either direction', () => {
    const late = NOW + SIGNATURE_TOLERANCE_MS + 1
    expect(verifyGhostSignature(sign(BODY, NOW), BODY, SECRET, late)).toBe(false)
    expect(verifyGhostSignature(sign(BODY, late), BODY, SECRET, NOW)).toBe(false)
  })

  it('rejects missing or malformed headers without throwing', () => {
    for (const header of [
      null,
      '',
      'sha256=abc, t=1',
      `sha256=${'0'.repeat(64)}`,
      `md5=${'0'.repeat(64)}, t=${NOW}`,
      `${sign(BODY, NOW)} `,
    ]) {
      expect(verifyGhostSignature(header, BODY, SECRET, NOW)).toBe(false)
    }
  })
})
