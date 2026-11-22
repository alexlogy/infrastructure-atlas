/**
 * Geometry for the mountain Journey scene, in SVG viewBox units. Positions are computed from the
 * number of published milestones, never stored: the path climbs left to right along a ridge and the
 * last milestone sits on the summit.
 */
export const SCENE = { width: 1600, height: 560 } as const

export type Point = { x: number; y: number }

const FIRST_X = 130
const SUMMIT_X = 1360
const BASE_Y = 470
const SUMMIT_Y = 165
/** How far the ridge drops between two milestones, so each one stands on its own peak. */
const VALLEY = 55

/** Milestone positions, oldest first. The last one is always the summit (highest point). */
export function milestonePoints(count: number): Point[] {
  if (count <= 0) return []
  if (count === 1) return [{ x: SUMMIT_X, y: SUMMIT_Y }]
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    return {
      x: FIRST_X + (SUMMIT_X - FIRST_X) * t,
      y: BASE_Y - (BASE_Y - SUMMIT_Y) * t ** 1.15,
    }
  })
}

const round = (n: number) => Math.round(n * 10) / 10

/** Cubic Bézier segments through the points (Catmull-Rom), as one SVG path. */
export function smoothPath(points: Point[], from = 0, to = points.length - 1): string {
  if (points.length === 0) return ''
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]
  let d = `M${round(p(from).x)} ${round(p(from).y)}`
  for (let i = from; i < to; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)]
    // /8 rather than the usual /6 keeps the crests a little sharper, more peak than hill.
    const c1 = { x: p1.x + (p2.x - p0.x) / 8, y: p1.y + (p2.y - p0.y) / 8 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 8, y: p2.y - (p3.y - p1.y) / 8 }
    d += ` C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(p2.x)} ${round(p2.y)}`
  }
  return d
}

export type JourneyLayout = {
  /** One point per milestone, in display order. */
  points: Point[]
  /** The glowing trail, from the left edge to the summit. */
  trail: string
  /** Closed foreground mountain whose crest the trail follows. */
  ridge: string
}

export function journeyLayout(count: number): JourneyLayout {
  const points = milestonePoints(count)
  if (points.length === 0) return { points, trail: '', ridge: '' }
  const summit = points[points.length - 1]
  // The crest rises from a low left edge over one peak per milestone, with a valley between each
  // pair, then falls away on the far side of the summit.
  const peaks = points.flatMap((p, i) => {
    const next = points[i + 1]
    if (!next) return [p]
    const gap = next.x - p.x
    return [p, { x: p.x + gap * 0.55, y: Math.max(p.y, next.y) + Math.min(VALLEY, gap * 0.4) }]
  })
  const crest = [
    { x: 0, y: BASE_Y + 50 },
    ...peaks,
    { x: summit.x + 110, y: summit.y + 110 },
    { x: SCENE.width, y: summit.y + 175 },
  ]
  const trail = smoothPath(crest, 0, crest.length - 3)
  const ridge = `${smoothPath(crest)} L${SCENE.width} ${SCENE.height} L0 ${SCENE.height} Z`
  return { points, trail, ridge }
}

/** Percent position inside the scene, for DOM overlays laid over the SVG. */
export const toPercent = ({ x, y }: Point) => ({
  left: `${round((x / SCENE.width) * 100)}%`,
  top: `${round((y / SCENE.height) * 100)}%`,
})
