'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'

import { markerKey, markerStyleFor } from '@/lib/atlas-markers'
import type { AtlasView, LatLng } from '@/types/view-models'

import { useGlobeCapabilities } from './capabilities'
import { MarkerIcon } from './MarkerIcon'

// three.js only loads in the browser, after the HTML list is already usable.
const Globe = dynamic(() => import('./Globe'), {
  ssr: false,
  loading: () => <GlobeNote>Loading the globe…</GlobeNote>,
})

const subscribeHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/**
 * Server-rendered list of places (the accessible, no-WebGL path) plus a
 * progressively enhanced globe. Both drive the same selection state.
 */
export function AtlasExplorer({ atlas, center }: { atlas: AtlasView; center: LatLng }) {
  const caps = useGlobeCapabilities()
  const [picked, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  // Links such as /atlas#place-12 (from the home page globe) preselect that place.
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => '',
  )
  const fromHash = hash.startsWith('#place-') ? hash.slice('#place-'.length) : null
  const selectedId = picked ?? (atlas.nodes.some((n) => n.id === fromHash) ? fromHash : null)

  const key = useMemo(() => markerKey(atlas.nodes.map((n) => n.category)), [atlas.nodes])
  const showKey = key.some((entry) => entry.category)

  /** Selecting from the globe also brings the place's card into view; the index does not. */
  const select = useCallback(
    (id: string, scrollToCard = true) => {
      setSelectedId(id)
      if (!scrollToCard) return
      document.getElementById(`place-${id}`)?.scrollIntoView({
        block: 'nearest',
        behavior: caps?.reducedMotion ? 'auto' : 'smooth',
      })
    },
    [caps?.reducedMotion],
  )

  const selected = atlas.nodes.find((n) => n.id === selectedId) ?? null
  const q = query.trim().toLowerCase()
  const matches = q
    ? atlas.nodes.filter((n) =>
        [n.label, n.place, n.category].some((v) => v?.toLowerCase().includes(q)),
      )
    : atlas.nodes

  return (
    <>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <figure className="mx-auto w-full max-w-2xl">
          <div aria-hidden="true" className="relative aspect-square w-full">
            <div className="absolute inset-[4%] rounded-full shadow-[0_0_70px_8px_rgb(101_214_223/0.16)]" />
            <div className="absolute inset-0">
              {caps?.webgl && (
                <Globe
                  nodes={atlas.nodes}
                  arcs={atlas.arcs}
                  center={center}
                  selectedId={selectedId}
                  onSelect={select}
                  reducedMotion={caps.reducedMotion}
                  lowDetail={caps.lowDetail}
                />
              )}
              {caps && !caps.webgl && (
                <GlobeNote>The interactive globe isn’t available in this browser.</GlobeNote>
              )}
            </div>
          </div>
          <figcaption className="mt-3 text-center text-sm text-muted">
            {caps?.webgl ? 'Drag to rotate the globe. ' : ''}
            Every place is listed below.
          </figcaption>
          {caps?.webgl && showKey && (
            <ul
              aria-label="Marker key"
              className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted"
            >
              {key.map((entry) => (
                <li key={entry.category ?? ''} className="flex items-center gap-2">
                  <MarkerIcon style={entry} />
                  {entry.category ?? 'Other places'}
                </li>
              ))}
            </ul>
          )}
        </figure>

        <aside aria-label="Place details" className="space-y-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-line bg-raised/80 p-6" aria-live="polite">
            {selected ? (
              <>
                <p className="text-xs font-medium tracking-wide text-gold uppercase">
                  Selected place
                </p>
                <p className="mt-1 font-display text-xl font-semibold text-ink">{selected.label}</p>
                {selected.place && <p className="text-sm text-muted">{selected.place}</p>}
                {selected.stories.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm">
                    {selected.stories.map((story) => (
                      <li key={`${story.kind}-${story.href}`}>
                        <span className="text-muted">
                          {story.kind === 'project' ? 'Project' : 'Milestone'}:
                        </span>{' '}
                        <Link
                          href={story.href}
                          className="text-accent underline underline-offset-4 hover:text-ink"
                        >
                          {story.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted">No published stories here yet.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">
                Choose a place on the globe or from the index to see its stories.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-surface/60 p-6">
            {caps && (
              <>
                <label htmlFor="atlas-search" className="text-sm font-medium text-ink">
                  Find a place
                </label>
                <input
                  id="atlas-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="City, region or category"
                  className="mt-2 w-full rounded-lg border border-line bg-deep px-3 py-2 text-sm text-ink placeholder:text-subtle focus:border-accent"
                />
              </>
            )}
            <ul aria-label="Place index" className="mt-3 max-h-80 space-y-1 overflow-y-auto">
              {matches.map((node) => (
                <li key={node.id}>
                  <a
                    href={`#place-${node.id}`}
                    aria-current={node.id === selectedId ? 'true' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      select(node.id, false)
                      window.history.replaceState(null, '', `#place-${node.id}`)
                    }}
                    className="flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 text-sm text-muted transition-colors duration-150 hover:bg-raised hover:text-ink aria-[current=true]:bg-raised aria-[current=true]:text-ink"
                  >
                    <span>{node.label}</span>
                    {node.place && (
                      <span className="truncate text-xs text-subtle">{node.place}</span>
                    )}
                  </a>
                </li>
              ))}
              {matches.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted">No places match “{query}”.</li>
              )}
            </ul>
          </div>
        </aside>
      </div>

      <ol aria-label="Places" className="mt-12 grid gap-4 sm:grid-cols-2">
        {atlas.nodes.map((node) => {
          const isSelected = node.id === selectedId
          return (
            <li
              key={node.id}
              id={`place-${node.id}`}
              className={`scroll-mt-24 rounded-lg border bg-surface p-5 ${
                isSelected ? 'border-gold' : 'border-line'
              }`}
            >
              <h2 className="text-lg font-semibold text-ink">{node.label}</h2>
              {node.place && <p className="mt-1 text-sm text-muted">{node.place}</p>}
              {node.category && (
                <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                  <MarkerIcon style={markerStyleFor(key, node.category)} />
                  {node.category}
                </p>
              )}
              {caps?.webgl && (
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(node.id)}
                  className={`mt-3 rounded-md border px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    isSelected
                      ? 'border-gold text-gold'
                      : 'border-line text-muted hover:border-accent hover:text-accent'
                  }`}
                >
                  {isSelected ? 'Shown on globe' : 'Show on globe'}
                  <span className="sr-only">: {node.label}</span>
                </button>
              )}
              {node.stories.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {node.stories.map((story) => (
                    <li key={`${story.kind}-${story.href}`}>
                      <span className="text-muted">
                        {story.kind === 'project' ? 'Project' : 'Milestone'}:
                      </span>{' '}
                      <Link
                        href={story.href}
                        className="text-accent underline underline-offset-4 hover:text-ink"
                      >
                        {story.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">No published stories here yet.</p>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}

function GlobeNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center rounded-full border border-dashed border-line p-8 text-center text-sm text-muted">
      {children}
    </div>
  )
}
