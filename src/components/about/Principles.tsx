import type { AboutPageView } from '@/types/view-models'

/** Editorial principle blocks: a gold index, a short title and a paragraph. No icon cards. */
export function Principles({
  principles,
  heading: H = 'h3',
  columns = 'sm:grid-cols-2',
}: {
  principles: AboutPageView['principles']
  heading?: 'h2' | 'h3'
  columns?: string
}) {
  return (
    <ol className={`grid gap-x-10 gap-y-8 ${columns}`}>
      {principles.map((p, i) => (
        <li key={p.title} className="border-t border-line pt-5">
          <p aria-hidden="true" className="font-display text-sm text-gold">
            0{i + 1}
          </p>
          <H className="mt-2 font-display text-xl font-semibold text-ink">{p.title}</H>
          {p.body && <p className="mt-2 leading-relaxed text-muted">{p.body}</p>}
        </li>
      ))}
    </ol>
  )
}
