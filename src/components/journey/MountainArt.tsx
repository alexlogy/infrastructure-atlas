import { type JourneyLayout, SCENE } from '@/lib/journey'

/** Deterministic "random" stars so server and client render the same markup. */
const STARS = Array.from({ length: 46 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453
  const b = Math.sin(i * 78.233) * 12345.6789
  return {
    x: Math.round((a - Math.floor(a)) * SCENE.width),
    y: Math.round((b - Math.floor(b)) * 230),
    r: i % 7 === 0 ? 1.6 : 0.9,
    o: 0.25 + ((i * 37) % 50) / 100,
  }
})

/**
 * Decorative layers, back to front: sky, stars, far and middle ranges, valley fog, the foreground
 * ridge, the glowing trail and the summit glow and flag. Milestone controls are DOM overlays.
 */
export function MountainArt({
  layout,
  revealState,
}: {
  layout: JourneyLayout
  revealState: 'static' | 'hidden' | 'drawing'
}) {
  const summit = layout.points.at(-1)
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
      preserveAspectRatio="none"
      className="journey-art absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="journey-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d3549" />
          <stop offset="1" stopColor="#0c1b2a" />
        </linearGradient>
        <linearGradient id="journey-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#173044" />
          <stop offset="1" stopColor="#091522" />
        </linearGradient>
        <linearGradient id="journey-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#13293c" />
          <stop offset="0.6" stopColor="#0a1826" />
          <stop offset="1" stopColor="#07111d" />
        </linearGradient>
        <linearGradient id="journey-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b5f4f4" stopOpacity="0" />
          <stop offset="0.6" stopColor="#b5f4f4" stopOpacity="0.06" />
          <stop offset="1" stopColor="#b5f4f4" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="journey-summit">
          <stop offset="0" stopColor="#e5b96d" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e5b96d" stopOpacity="0" />
        </radialGradient>
        <filter id="journey-halo" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#b5f4f4" opacity={s.o} />
      ))}

      {/* Distant ranges rise into place as the scene scrolls in (styles.css, horizon-rise). */}
      <g className="journey-far">
        <path
          fill="url(#journey-far)"
          opacity="0.55"
          d="M0 330 L120 270 L210 300 L330 215 L430 280 L540 230 L650 290 L760 200 L880 265 L990 185 L1110 250 L1220 175 L1330 240 L1450 195 L1600 260 L1600 560 L0 560 Z"
        />
      </g>
      <g className="journey-mid">
        <path
          fill="url(#journey-mid)"
          opacity="0.85"
          d="M0 410 L90 360 L200 395 L320 320 L440 380 L560 330 L690 400 L800 340 L930 395 L1060 315 L1180 370 L1300 300 L1420 360 L1520 320 L1600 350 L1600 560 L0 560 Z"
        />
      </g>
      <rect y="330" width={SCENE.width} height="140" fill="url(#journey-fog)" />

      {summit && <circle cx={summit.x} cy={summit.y} r="150" fill="url(#journey-summit)" />}
      <path fill="url(#journey-front)" d={layout.ridge} />
      {/* Moonlit edge along the crest. */}
      <path d={layout.ridge} fill="none" stroke="#b5f4f4" strokeOpacity="0.12" strokeWidth="1.5" />

      <g className="journey-trail" data-reveal={revealState}>
        <path
          d={layout.trail}
          pathLength={1}
          fill="none"
          stroke="#65d6df"
          strokeOpacity="0.55"
          strokeWidth="10"
          strokeLinecap="round"
          filter="url(#journey-halo)"
        />
        <path
          d={layout.trail}
          pathLength={1}
          fill="none"
          stroke="#b5f4f4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {summit && (
        <g transform={`translate(${summit.x} ${summit.y})`}>
          <line x1="0" y1="-8" x2="0" y2="-62" stroke="#e5b96d" strokeWidth="2" />
          <path d="M0 -62 L30 -52 L0 -42 Z" fill="#e5b96d" />
        </g>
      )}
    </svg>
  )
}
