// Regenerates public/generic/coastlines.json from Natural Earth land data (public domain),
// redistributed by the world-atlas package. Run: node scripts/build-coastlines.mjs [110m|50m]
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import { mesh } from 'topojson-client'

const scale = process.argv[2] ?? '110m'
const require = createRequire(import.meta.url)
const topology = JSON.parse(readFileSync(require.resolve(`world-atlas/land-${scale}.json`), 'utf8'))
const coast = mesh(topology, topology.objects.land)

// Flat [lng, lat, lng, lat, ...] per line, 2 decimals (~1 km): plenty for a globe a few hundred px wide.
const round = (n) => Math.round(n * 100) / 100
const lines = coast.coordinates.map((line) =>
  line.flatMap(([lng, lat]) => [round(lng), round(lat)]),
)

writeFileSync(
  new URL('../public/generic/coastlines.json', import.meta.url),
  JSON.stringify({
    source: `Natural Earth ${scale} land (public domain), via world-atlas`,
    lines,
  }),
)
console.log(`${lines.length} lines, ${lines.reduce((n, l) => n + l.length / 2, 0)} points`)
