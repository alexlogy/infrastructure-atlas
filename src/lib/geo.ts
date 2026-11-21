export type Vec3 = [x: number, y: number, z: number]

const RAD = Math.PI / 180

/**
 * Latitude/longitude to a point on a sphere of `radius`, in three.js axes:
 * the north pole is +y, (0°, 0°) is +x and (0°, 90°E) is -z.
 */
export function latLngToVector(latitude: number, longitude: number, radius = 1): Vec3 {
  const phi = (90 - latitude) * RAD
  const theta = (longitude + 180) * RAD
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}

/** Angle in radians between two lat/lng points along the sphere surface. */
export function angularDistance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const [ax, ay, az] = latLngToVector(a.latitude, a.longitude)
  const [bx, by, bz] = latLngToVector(b.latitude, b.longitude)
  return Math.acos(Math.min(1, Math.max(-1, ax * bx + ay * by + az * bz)))
}
