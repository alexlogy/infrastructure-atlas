import { describe, expect, it } from 'vitest'

import { angularDistance, latLngToVector } from '@/lib/geo'

const close = (actual: number[], expected: number[]) =>
  actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 6))

describe('latLngToVector', () => {
  it('places reference points on the expected axes', () => {
    close(latLngToVector(90, 0), [0, 1, 0])
    close(latLngToVector(-90, 0), [0, -1, 0])
    close(latLngToVector(0, 0), [1, 0, 0])
    close(latLngToVector(0, 90), [0, 0, -1])
    close(latLngToVector(0, 180), [-1, 0, 0])
  })

  it('scales by radius and stays on the sphere', () => {
    const [x, y, z] = latLngToVector(35.5, 139.7, 2)
    expect(Math.hypot(x, y, z)).toBeCloseTo(2, 6)
  })
})

describe('angularDistance', () => {
  it('is 0 for the same point and π for antipodes', () => {
    const p = { latitude: 10, longitude: 20 }
    expect(angularDistance(p, p)).toBeCloseTo(0, 6)
    expect(angularDistance(p, { latitude: -10, longitude: -160 })).toBeCloseTo(Math.PI, 6)
  })

  it('is π/2 between the equator and a pole', () => {
    expect(
      angularDistance({ latitude: 0, longitude: 45 }, { latitude: 90, longitude: 0 }),
    ).toBeCloseTo(Math.PI / 2, 6)
  })
})
