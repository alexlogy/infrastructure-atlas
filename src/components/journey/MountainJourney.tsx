'use client'

import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { journeyLayout, toPercent } from '@/lib/journey'

import { MountainArt } from './MountainArt'

export type JourneyStop = { id: string; title: string; dateLabel: string; era: string | null }

const HASH_PREFIX = '#milestone-'
const subscribeHash = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/**
 * The mountain timeline: a glowing trail climbing a ridge, one button per milestone on the trail
 * and the latest on the gold summit. Choosing a milestone shows its server-rendered details below.
 * `#milestone-<id>` preselects one. Without JavaScript the summit's details show.
 */
export function MountainJourney({
  stops,
  details,
  showEras = false,
  deepLinks = false,
}: {
  stops: JourneyStop[]
  /** Server-rendered detail panel per milestone id. */
  details: Record<string, ReactNode>
  showEras?: boolean
  /** Keep the URL hash in step with the selection (on the Journey page, where cards carry the ids). */
  deepLinks?: boolean
}) {
  const layout = useMemo(() => journeyLayout(stops.length), [stops.length])
  const panelId = useId()
  const scene = useRef<HTMLDivElement>(null)
  const region = useRef<HTMLDivElement>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [reveal, setReveal] = useState<'static' | 'hidden' | 'drawing'>('static')

  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => '',
  )
  const hashId = hash.startsWith(HASH_PREFIX) ? hash.slice(HASH_PREFIX.length) : null
  const summitId = stops.at(-1)?.id ?? null
  const valid = (id: string | null) => (id && id in details ? id : null)
  const selectedId = valid(picked) ?? valid(hashId) ?? summitId
  const selectedIndex = stops.findIndex((s) => s.id === selectedId)

  // Draw the trail when the scene scrolls into view. If it is already visible on load the trail
  // simply stays drawn, so there is no flash; reduced motion is handled in CSS.
  useEffect(() => {
    const el = scene.current
    if (!el) return
    let first = true
    const observer = new IntersectionObserver(([entry]) => {
      if (first) {
        first = false
        if (entry.isIntersecting) observer.disconnect()
        else setReveal('hidden')
      } else if (entry.isIntersecting) {
        setReveal('drawing')
        observer.disconnect()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // On narrow screens the scene scrolls sideways: keep the selected milestone in view.
  useEffect(() => {
    const box = region.current
    const node = box?.querySelector<HTMLElement>('[aria-current="step"]')
    if (!box || !node || box.scrollWidth <= box.clientWidth) return
    const n = node.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    box.scrollBy({
      left: n.left + n.width / 2 - (b.left + b.width / 2),
      behavior: picked && smooth ? 'smooth' : 'auto',
    })
  }, [selectedId, picked])

  const select = (id: string) => {
    setPicked(id)
    if (deepLinks) window.history.replaceState(null, '', `${HASH_PREFIX}${id}`)
  }

  const eras = showEras ? [...new Set(stops.flatMap((s) => (s.era ? [s.era] : [])))] : []
  const selectedEra = stops[selectedIndex]?.era

  return (
    <div>
      {eras.length > 1 && (
        <div role="group" aria-label="Eras" className="mb-6 flex flex-wrap gap-2">
          {eras.map((era) => (
            <button
              key={era}
              type="button"
              aria-pressed={era === selectedEra}
              onClick={() => select(stops.find((s) => s.era === era)!.id)}
              className="min-h-11 rounded-full border border-line px-4 text-sm text-muted transition-colors duration-150 hover:border-accent hover:text-ink aria-pressed:border-accent aria-pressed:bg-accent/10 aria-pressed:text-ink"
            >
              {era}
            </button>
          ))}
        </div>
      )}

      <div
        ref={region}
        role="region"
        aria-label="Journey scene"
        tabIndex={0}
        className="-mx-(--gutter) overflow-x-auto px-(--gutter) pt-12 pb-2 sm:mx-0 sm:px-0"
      >
        <div
          ref={scene}
          className="relative aspect-[1600/560] overflow-visible rounded-2xl"
          style={{ minWidth: `max(34rem, ${12.5 * (stops.length - 1)}rem)` }}
        >
          <MountainArt layout={layout} revealState={reveal} />
          <ol className="contents">
            {stops.map((stop, i) => {
              const summit = i === stops.length - 1
              const selected = stop.id === selectedId
              return (
                <li key={stop.id} className="contents">
                  <button
                    type="button"
                    aria-current={selected ? 'step' : undefined}
                    aria-controls={panelId}
                    onClick={() => select(stop.id)}
                    style={toPercent(layout.points[i])}
                    className="group absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                  >
                    <span
                      aria-hidden="true"
                      className={`block rounded-full transition-transform duration-150 group-hover:scale-125 ${
                        summit
                          ? 'h-4.5 w-4.5 bg-gold ring-4 ring-gold/35'
                          : 'h-3.5 w-3.5 bg-accent ring-4 ring-accent/25'
                      } ${selected ? 'scale-125 ring-ice/70 outline-2 outline-offset-4 outline-ice/60' : ''}`}
                    />
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-[calc(50%+0.75rem)] left-1/2 w-px bg-linear-to-t from-ice/60 to-transparent ${
                        summit ? 'h-14' : 'h-6'
                      }`}
                    />
                    <span
                      className={`absolute left-1/2 w-36 -translate-x-1/2 text-center ${
                        summit ? 'bottom-[calc(50%+4.25rem)]' : 'bottom-[calc(50%+2.25rem)]'
                      }`}
                    >
                      <span className={`block text-xs ${summit ? 'text-gold' : 'text-muted'}`}>
                        {stop.dateLabel}
                      </span>
                      <span
                        className={`mt-0.5 line-clamp-2 block text-sm leading-snug font-medium ${
                          selected
                            ? 'text-ink underline decoration-accent underline-offset-4'
                            : 'text-ink/90'
                        }`}
                      >
                        {stop.title}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      <div id={panelId} className="mt-8">
        {selectedId && details[selectedId]}
        {stops.length > 1 && (
          <div className="mt-4 flex flex-wrap justify-between gap-3">
            <StepButton
              disabled={selectedIndex <= 0}
              onClick={() => select(stops[selectedIndex - 1].id)}
            >
              ← Earlier
            </StepButton>
            <StepButton
              disabled={selectedIndex >= stops.length - 1}
              onClick={() => select(stops[selectedIndex + 1].id)}
            >
              Later →
            </StepButton>
          </div>
        )}
      </div>
    </div>
  )
}

function StepButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-11 rounded-lg border border-line px-4 text-sm text-ink transition-colors duration-150 hover:border-accent disabled:cursor-not-allowed disabled:text-subtle disabled:hover:border-line"
    >
      {children}
    </button>
  )
}
