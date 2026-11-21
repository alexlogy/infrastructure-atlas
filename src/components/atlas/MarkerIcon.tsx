import type { MarkerStyle } from '@/lib/atlas-markers'

const SHAPES: Record<MarkerStyle['shape'], React.ReactNode> = {
  circle: <circle cx="6" cy="6" r="4.5" />,
  diamond: <path d="M6 .8 11.2 6 6 11.2.8 6Z" />,
  square: <rect x="1.8" y="1.8" width="8.4" height="8.4" />,
  triangle: <path d="M6 1 11 10.5H1Z" />,
}

/** HTML twin of a globe marker, so the key and place cards show the same shape and colour. */
export function MarkerIcon({ style }: { style: MarkerStyle }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      fill="currentColor"
      className={`h-3 w-3 shrink-0 ${style.color === 'gold' ? 'text-gold' : 'text-accent'}`}
    >
      {SHAPES[style.shape]}
    </svg>
  )
}
