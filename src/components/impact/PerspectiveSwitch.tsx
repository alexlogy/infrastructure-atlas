import Link from 'next/link'

import { PERSPECTIVES, type Perspective } from '@/lib/perspective'

const LABELS: Record<Perspective, string> = {
  leadership: 'Leadership',
  engineering: 'Engineering',
}

/**
 * Segmented control built from plain links: works without JavaScript, every
 * state has its own URL (`?view=`), and the active option is exposed with
 * `aria-current` plus a filled style and a check mark, not colour alone.
 */
export function PerspectiveSwitch({ slug, active }: { slug: string; active: Perspective }) {
  return (
    <nav aria-label="Project perspective">
      <ul className="inline-flex rounded-md border border-line p-1">
        {PERSPECTIVES.map((perspective) => {
          const isActive = perspective === active
          return (
            <li key={perspective}>
              <Link
                href={{ pathname: `/impact/${slug}`, query: { view: perspective } }}
                scroll={false}
                replace
                aria-current={isActive ? 'true' : undefined}
                className={`inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isActive ? 'bg-accent text-midnight' : 'text-muted hover:text-ink'
                }`}
              >
                {isActive && <span aria-hidden="true">✓</span>}
                {LABELS[perspective]}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export const perspectiveLabel = (perspective: Perspective) => LABELS[perspective]
