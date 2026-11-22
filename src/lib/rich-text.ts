type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] }

/**
 * Plain text from a Lexical document, cut at a word boundary with an ellipsis. Used for short
 * previews (the impact dashboard) where the full rich text belongs on the project page.
 */
export function richTextExcerpt(
  state: { root?: LexicalNode } | null | undefined,
  max = 220,
): string | null {
  const blocks: string[] = []
  const walk = (node: LexicalNode, out: string[]) => {
    if (typeof node.text === 'string') out.push(node.text)
    for (const child of node.children ?? []) walk(child, out)
  }
  for (const block of state?.root?.children ?? []) {
    const parts: string[] = []
    walk(block, parts)
    const text = parts.join('').replace(/\s+/g, ' ').trim()
    if (text) blocks.push(text)
  }
  const text = blocks.join(' ')
  if (!text) return null
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, '')}…`
}
