import type { CSSProperties } from 'react'

/** Position in a staggered group, read by the `.reveal` and `.enter-on-scroll` styles as `--i`. */
export const stagger = (i: number): CSSProperties => ({ '--i': i }) as CSSProperties
