import { describe, expect, it } from 'vitest'

import { parseServerEnv } from '@/lib/env'

const base = {
  DATABASE_URI: 'postgresql://user:pass@localhost:5432/db',
  PAYLOAD_SECRET: 'x'.repeat(40),
}

describe('parseServerEnv', () => {
  it('accepts a minimal development config and treats Ghost as optional', () => {
    const env = parseServerEnv({ ...base, GHOST_URL: '', GHOST_CONTENT_API_KEY: '' })
    expect(env.NODE_ENV).toBe('development')
    expect(env.GHOST_URL).toBeUndefined()
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
  })

  it('reports missing required values without echoing secrets', () => {
    expect(() => parseServerEnv({ PAYLOAD_SECRET: 'top-secret-value' })).toThrow(/DATABASE_URI/)
    try {
      parseServerEnv({ PAYLOAD_SECRET: 'top-secret-value' })
    } catch (e) {
      expect((e as Error).message).not.toContain('top-secret-value')
    }
  })

  it('rejects short or placeholder secrets in production', () => {
    expect(() =>
      parseServerEnv({ ...base, NODE_ENV: 'production', PAYLOAD_SECRET: 'short' }),
    ).toThrow(/at least 32/)
    expect(() =>
      parseServerEnv({
        ...base,
        NODE_ENV: 'production',
        PAYLOAD_SECRET: 'replace-with-a-long-random-secret',
      }),
    ).toThrow(/at least 32/)
    expect(parseServerEnv({ ...base, NODE_ENV: 'production' }).NODE_ENV).toBe('production')
  })

  it('rejects a malformed Ghost URL', () => {
    expect(() => parseServerEnv({ ...base, GHOST_URL: 'not a url' })).toThrow(/GHOST_URL/)
  })
})
