export const MARKER_SHAPES = ['circle', 'diamond', 'square', 'triangle'] as const
// Gold is kept for the selected place, so categories alternate cyan and ice.
export const MARKER_COLORS = ['accent', 'ice'] as const

export type MarkerStyle = {
  shape: (typeof MARKER_SHAPES)[number]
  color: (typeof MARKER_COLORS)[number]
}
export type MarkerKeyEntry = MarkerStyle & { category: string | null }

/** Uncategorised places always keep the original look. */
export const DEFAULT_MARKER: MarkerStyle = { shape: 'circle', color: 'accent' }

// Shape and colour both alternate; the offset after each round of shapes yields 8 distinct pairs.
const styleAt = (slot: number): MarkerStyle => ({
  shape: MARKER_SHAPES[slot % MARKER_SHAPES.length],
  color: MARKER_COLORS[(slot + Math.floor(slot / MARKER_SHAPES.length)) % MARKER_COLORS.length],
})

/**
 * One style per category, assigned A–Z after the default. Every category also
 * differs in shape from its neighbours, so the key never relies on colour alone.
 * shortcut: styles repeat after 7 categories; add shapes/colours if sites need more.
 */
export function markerKey(categories: (string | null)[]): MarkerKeyEntry[] {
  const named = [...new Set(categories.filter((c): c is string => Boolean(c)))].sort((a, b) =>
    a.localeCompare(b),
  )
  return [
    ...(categories.some((c) => !c) ? [{ category: null, ...DEFAULT_MARKER }] : []),
    ...named.map((category, i) => ({ category, ...styleAt(i + 1) })),
  ]
}

export function markerStyleFor(key: MarkerKeyEntry[], category: string | null): MarkerStyle {
  const entry = key.find((e) => e.category === (category || null))
  return entry ? { shape: entry.shape, color: entry.color } : DEFAULT_MARKER
}
