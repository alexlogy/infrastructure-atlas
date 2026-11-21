export const PERSPECTIVES = ['leadership', 'engineering'] as const

export type Perspective = (typeof PERSPECTIVES)[number]

/**
 * Picks the narrative to show for a project. Honours the requested `?view=`
 * when that narrative exists, otherwise falls back to the first one written.
 * Returns null when the project has neither narrative.
 */
export function selectPerspective(
  requested: string | string[] | undefined,
  available: Record<Perspective, boolean>,
): Perspective | null {
  const wanted = Array.isArray(requested) ? requested[0] : requested
  const match = PERSPECTIVES.find((p) => p === wanted && available[p])
  return match ?? PERSPECTIVES.find((p) => available[p]) ?? null
}
