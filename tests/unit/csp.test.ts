import { describe, expect, it } from 'vitest'

import { buildCsp, toCspOrigins } from '@/lib/csp'

const directive = (csp: string, name: string) =>
  csp
    .split('; ')
    .find((d) => d.startsWith(`${name} `) || d === name)
    ?.split(' ')
    .slice(1)

describe('buildCsp', () => {
  const prod = buildCsp({
    nonce: 'abc123',
    isDev: false,
    imageOrigins: ['https://blog.example.test'],
    upgradeInsecure: true,
  })

  it('only runs nonced scripts in production, with no eval or inline fallback', () => {
    expect(directive(prod, 'script-src')).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"])
    expect(prod).not.toContain('unsafe-eval')
    expect(directive(prod, 'script-src')).not.toContain("'unsafe-inline'")
  })

  it('locks down plugins, base URLs, forms, framing and connections', () => {
    expect(directive(prod, 'object-src')).toEqual(["'none'"])
    expect(directive(prod, 'base-uri')).toEqual(["'self'"])
    expect(directive(prod, 'form-action')).toEqual(["'self'"])
    expect(directive(prod, 'frame-ancestors')).toEqual(["'self'"])
    expect(directive(prod, 'connect-src')).toEqual(["'self'"])
    expect(directive(prod, 'upgrade-insecure-requests')).toEqual([])
  })

  it('allows only listed image origins, never a blanket scheme', () => {
    expect(directive(prod, 'img-src')).toEqual([
      "'self'",
      'data:',
      'blob:',
      'https://blog.example.test',
    ])
    expect(directive(prod, 'img-src')).not.toContain('https:')
  })

  it('adds eval and the HMR websocket only in development', () => {
    const dev = buildCsp({ nonce: 'n', isDev: true, imageOrigins: [], upgradeInsecure: false })
    expect(directive(dev, 'script-src')).toContain("'unsafe-eval'")
    expect(directive(dev, 'connect-src')).toContain('ws:')
    expect(dev).not.toContain('upgrade-insecure-requests')
  })
})

describe('toCspOrigins', () => {
  it('keeps http(s) origins only, de-duplicated, from comma or space lists', () => {
    expect(
      toCspOrigins([
        'https://blog.example.test/some/path',
        'https://cdn.example.test, https://blog.example.test  http://localhost:3201',
        "javascript:alert(1) 'unsafe-inline' * data:x not-a-url",
        undefined,
      ]),
    ).toEqual(['https://blog.example.test', 'https://cdn.example.test', 'http://localhost:3201'])
  })
})
