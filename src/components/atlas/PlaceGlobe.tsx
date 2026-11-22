'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { type ReactNode, useRef, useState } from 'react'

import type { AtlasArcView, AtlasNodeView, LatLng } from '@/types/view-models'

import { useGlobeCapabilities, useNearViewport } from './capabilities'

const Globe = dynamic(() => import('./Globe'), { ssr: false, loading: () => <Disc /> })

/** Stand-in matching the globe's on-screen size (radius 1 at the camera's distance and FOV). */
function Disc() {
  return <div className="h-full w-full rounded-full border border-line bg-surface/40" />
}

/**
 * A globe with an HTML card beside it. The card and the place buttons carry everything (names,
 * stories, links); the globe is decoration that loads only near the viewport and with WebGL, and
 * marks the chosen place in gold. With `overview`, nothing is chosen at first and the card shows
 * the overview instead, while the globe turns slowly (when motion is allowed).
 */
export function PlaceGlobe({
  nodes,
  arcs,
  center,
  overview,
  className = 'max-w-sm',
}: {
  nodes: AtlasNodeView[]
  arcs: AtlasArcView[]
  /** Starting view when nothing is chosen. */
  center?: LatLng
  /** Card content before a place is chosen. Omit to start with the first place chosen. */
  overview?: ReactNode
  className?: string
}) {
  const caps = useGlobeCapabilities()
  const ref = useRef<HTMLDivElement>(null)
  const near = useNearViewport(ref)
  const [picked, setPicked] = useState<string | null>(null)
  const selected = nodes.find((n) => n.id === picked) ?? (overview ? null : nodes[0]) ?? null
  if (nodes.length === 0) return null

  return (
    <div>
      <div
        ref={ref}
        aria-hidden="true"
        // Fades back as it scrolls out of view (styles.css, globe-recede); the card below stays put.
        className={`globe-recede relative mx-auto aspect-square w-full ${className}`}
      >
        {/* Atmosphere: a soft cyan rim drawn in CSS, so the GPU only draws the globe itself. */}
        <div className="absolute inset-[4%] rounded-full shadow-[0_0_70px_8px_rgb(101_214_223/0.16),inset_0_0_50px_rgb(181_244_244/0.07)]" />
        <div className="absolute inset-0">
          {caps?.webgl && near ? (
            <Globe
              nodes={nodes}
              arcs={arcs}
              center={selected ?? center ?? nodes[0]}
              selectedId={selected?.id ?? null}
              onSelect={setPicked}
              reducedMotion={caps.reducedMotion}
              lowDetail={caps.lowDetail}
              idleSpin={Boolean(overview)}
            />
          ) : (
            <div className="h-full w-full p-[4%]">
              <Disc />
            </div>
          )}
        </div>
      </div>

      <div className="relative -mt-14 rounded-xl border border-line bg-raised/95 p-5 shadow-2xl sm:mx-4">
        {selected ? (
          <>
            <p className="text-xs font-medium tracking-wide text-gold uppercase">Location</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">{selected.label}</p>
            {selected.place && <p className="text-sm text-muted">{selected.place}</p>}
            {selected.stories.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-ink/90">
                {selected.stories.slice(0, 3).map((story) => (
                  <li key={story.href + story.title} className="flex gap-2">
                    <span aria-hidden="true" className="text-accent">
                      ›
                    </span>
                    {story.title}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/atlas#place-${selected.id}`}
              className="mt-4 inline-flex text-sm font-medium text-accent underline-offset-4 hover:text-ink hover:underline"
            >
              Open in the atlas →
            </Link>
          </>
        ) : (
          overview
        )}

        {(overview ? nodes.length > 0 : nodes.length > 1) && (
          <div role="group" aria-label="Places" className="mt-4 flex flex-wrap gap-2">
            {nodes.slice(0, 8).map((node) => (
              <button
                key={node.id}
                type="button"
                aria-pressed={node.id === selected?.id}
                onClick={() => setPicked(node.id)}
                className="min-h-9 rounded-full border border-line px-3 text-xs text-muted transition-colors duration-150 hover:border-accent hover:text-ink aria-pressed:border-gold aria-pressed:text-ink"
              >
                {node.label}
              </button>
            ))}
            {nodes.length > 8 && (
              <Link
                href="/atlas"
                className="inline-flex min-h-9 items-center px-2 text-xs text-accent hover:text-ink"
              >
                +{nodes.length - 8} more
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
