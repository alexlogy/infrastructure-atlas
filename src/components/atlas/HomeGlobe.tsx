'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'

import type { AtlasView, LatLng } from '@/types/view-models'

import { useGlobeCapabilities, useNearViewport } from './capabilities'

const Globe = dynamic(() => import('./Globe'), { ssr: false, loading: () => <Disc /> })

/** Stand-in matching the globe's on-screen size (radius 1 at the camera's distance and FOV). */
function Disc() {
  return <div className="m-[4%] h-[92%] rounded-full border border-line bg-surface/40" />
}

/**
 * Decorative home page globe. three.js loads only when the section nears the
 * viewport and WebGL works; otherwise the plain disc stays. Selecting a marker
 * opens that place on /atlas, which is also reachable through the visible link.
 */
export function HomeGlobe({ atlas, center }: { atlas: AtlasView; center: LatLng }) {
  const caps = useGlobeCapabilities()
  const ref = useRef<HTMLDivElement>(null)
  const near = useNearViewport(ref)
  const router = useRouter()

  return (
    <div ref={ref} aria-hidden="true" className="mx-auto aspect-square w-full max-w-md">
      {caps?.webgl && near ? (
        <Globe
          nodes={atlas.nodes}
          arcs={atlas.arcs}
          center={center}
          selectedId={null}
          onSelect={(id) => router.push(`/atlas#place-${id}`)}
          reducedMotion={caps.reducedMotion}
          lowDetail={caps.lowDetail}
        />
      ) : (
        <Disc />
      )}
    </div>
  )
}
