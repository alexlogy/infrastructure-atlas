import { describe, expect, it } from 'vitest'

import { isSafeHref, toSafeLocalPath } from '@/lib/validation/links'

describe('isSafeHref', () => {
  it.each([
    '/journey',
    '/a/b?c=1#d',
    '#section',
    'https://example.com',
    'http://example.com/x',
    'mailto:someone@example.com',
  ])('accepts %s', (href) => expect(isSafeHref(href)).toBe(true))

  it.each([
    '',
    '   ',
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '//evil.example.com',
    'journey',
    'ftp://example.com',
  ])('rejects %j', (href) => expect(isSafeHref(href)).toBe(false))
})

describe('toSafeLocalPath', () => {
  it.each(['/journey', '/impact/sample?view=engineering', '/a#b'])('keeps %s', (path) =>
    expect(toSafeLocalPath(path)).toBe(path),
  )

  it.each([
    null,
    '',
    'journey',
    '//evil.example.com',
    '/\\evil.example.com',
    'https://evil.example.com',
    '/ /evil',
    'javascript:alert(1)',
  ])('rejects %j', (path) => expect(toSafeLocalPath(path)).toBeNull())
})
