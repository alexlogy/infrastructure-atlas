import { describe, expect, it } from 'vitest'

import { journeyLayout, milestonePoints, SCENE, smoothPath } from '@/lib/journey'

describe('milestonePoints', () => {
  it('handles empty and single timelines', () => {
    expect(milestonePoints(0)).toEqual([])
    expect(milestonePoints(1)).toHaveLength(1)
  })

  it.each([2, 3, 6, 12])('places %i milestones left to right, ending on the highest point', (n) => {
    const points = milestonePoints(n)
    expect(points).toHaveLength(n)
    for (let i = 1; i < n; i++) expect(points[i].x).toBeGreaterThan(points[i - 1].x)
    const summit = points[n - 1]
    expect(points.every((p) => p.y >= summit.y)).toBe(true)
    // The climb ends well above where it starts, and everything stays inside the scene.
    expect(points[0].y - summit.y).toBeGreaterThan(200)
    for (const p of points) {
      expect(p.x).toBeGreaterThan(0)
      expect(p.x).toBeLessThan(SCENE.width)
      expect(p.y).toBeGreaterThan(0)
      expect(p.y).toBeLessThan(SCENE.height)
    }
  })
})

describe('smoothPath', () => {
  it('passes through every point', () => {
    const points = [
      { x: 0, y: 10 },
      { x: 50, y: 5 },
      { x: 100, y: 0 },
    ]
    const d = smoothPath(points)
    expect(d.startsWith('M0 10')).toBe(true)
    expect(d).toContain(' 50 5 C')
    expect(d.endsWith(' 100 0')).toBe(true)
  })
})

describe('journeyLayout', () => {
  it('draws the trail through each milestone and stops at the summit', () => {
    const { points, trail, ridge } = journeyLayout(4)
    const r = (n: number) => Math.round(n * 10) / 10
    for (const p of points) expect(trail).toContain(`${r(p.x)} ${r(p.y)}`)
    const summit = points[3]
    expect(trail.endsWith(`${r(summit.x)} ${r(summit.y)}`)).toBe(true)
    expect(ridge.endsWith('Z')).toBe(true)
  })

  it('returns nothing to draw for an empty timeline', () => {
    expect(journeyLayout(0)).toEqual({ points: [], trail: '', ridge: '' })
  })
})
