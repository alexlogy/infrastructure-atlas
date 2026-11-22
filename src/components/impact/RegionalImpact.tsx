'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRef, useState } from 'react'

import { useGlobeCapabilities, useNearViewport } from '@/components/atlas/capabilities'
import type { AtlasArcView, AtlasNodeView } from '@/types/view-models'

const Globe = dynamic(() => import('@/components/atlas/Globe'), {
  ssr: false,
  loading: () => <Disc />,
})

function Disc() {
  return <div className="m-[4%] h-[92%] rounded-full border border-line bg-surface/40" />
}

/**
 * Right column of the impact dashboard: a small globe of the selected project's places, with an
 * HTML detail card for the chosen place. The card and place buttons carry everything; the globe
 * is decoration that loads only near the viewport and with WebGL.
 */
export function RegionalImpact({
  nodes,
  arcs,
}: {
  /** The project's published places, in the editor's order. */
  nodes: AtlasNodeView[]
  arcs: AtlasArcView[]
}) {
  const caps = useGlobeCapabilities()
  const ref = useRef<HTMLDivElement>(null)
  const near = useNearViewport(ref)
  const [picked, setPicked] = useState<string | null>(null)
  const selected = nodes.find((n) => n.id === picked) ?? nodes[0]
  if (!selected) return null

  return (
    <div>
      <div ref={ref} aria-hidden="true" className="mx-auto aspect-square w-full max-w-sm">
        {caps?.webgl && near ? (
          <Globe
            nodes={nodes}
            arcs={arcs}
            center={selected}
            selectedId={selected.id}
            onSelect={setPicked}
            reducedMotion={caps.reducedMotion}
            lowDetail={caps.lowDetail}
          />
        ) : (
          <Disc />
        )}
      </div>

      <div className="relative -mt-16 rounded-xl border border-line bg-raised/95 p-5 shadow-2xl xl:mx-4">
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

        {nodes.length > 1 && (
          <div role="group" aria-label="Project places" className="mt-4 flex flex-wrap gap-2">
            {nodes.map((node) => (
              <button
                key={node.id}
                type="button"
                aria-pressed={node.id === selected.id}
                onClick={() => setPicked(node.id)}
                className="min-h-9 rounded-full border border-line px-3 text-xs text-muted transition-colors duration-150 hover:border-accent hover:text-ink aria-pressed:border-gold aria-pressed:text-ink"
              >
                {node.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
