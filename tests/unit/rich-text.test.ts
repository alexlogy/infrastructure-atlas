import { describe, expect, it } from 'vitest'

import { richTextExcerpt } from '@/lib/rich-text'

const doc = (...paragraphs: string[][]) => ({
  root: {
    children: paragraphs.map((texts) => ({
      type: 'paragraph',
      children: texts.map((text) => ({ type: 'text', text })),
    })),
  },
})

describe('richTextExcerpt', () => {
  it('joins text across formatting runs and paragraphs', () => {
    expect(richTextExcerpt(doc(['Sample ', 'bold', ' text.'], ['Second  paragraph.']))).toBe(
      'Sample bold text. Second paragraph.',
    )
  })

  it('cuts long text at a word boundary with an ellipsis', () => {
    const out = richTextExcerpt(doc(['one two three four five six seven']), 20)
    expect(out).toBe('one two three four…')
  })

  it('returns null for empty or missing documents', () => {
    expect(richTextExcerpt(null)).toBeNull()
    expect(richTextExcerpt(doc(['   ']))).toBeNull()
  })
})
