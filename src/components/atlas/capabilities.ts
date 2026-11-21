'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

export type Capabilities = { webgl: boolean; reducedMotion: boolean; lowDetail: boolean }

let cached: Capabilities | null = null
function detectCapabilities(): Capabilities {
  if (cached) return cached
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  cached = {
    webgl: Boolean(gl),
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    lowDetail:
      window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4,
  }
  return cached
}

const noSubscribe = () => () => {}

/** null on the server and during hydration; detected once in the browser. */
export function useGlobeCapabilities(): Capabilities | null {
  return useSyncExternalStore(noSubscribe, detectCapabilities, () => null)
}

/** True once the element comes within `margin` of the viewport; stays true after. */
export function useNearViewport(ref: React.RefObject<Element | null>, margin = '200px'): boolean {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true)
      },
      { rootMargin: margin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, margin, near])
  return near
}
