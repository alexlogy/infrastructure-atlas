import { ProjectIcon } from '@/components/impact/ProjectIcon'
import type { AchievementView } from '@/types/view-models'

const COLUMNS = ['', 'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-4']

/**
 * Compact figures attached to the hero: gold line icons, large values, short captions. Only
 * published achievements appear; with none, the strip is not rendered at all.
 */
export function MetricStrip({ achievements }: { achievements: AchievementView[] }) {
  if (achievements.length === 0) return null
  return (
    <ul
      aria-label="Highlights"
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line/60 ${
        COLUMNS[Math.min(achievements.length, 4)]
      }`}
    >
      {achievements.map((a) => (
        <li
          key={a.id}
          className="flex gap-4 bg-surface/90 p-5 lg:p-6"
          title={a.explanation ?? undefined}
        >
          {a.icon && (
            <span className="mt-1 hidden text-gold sm:block">
              <ProjectIcon name={a.icon} />
            </span>
          )}
          <div>
            <p className="font-display text-3xl font-semibold text-ink lg:text-4xl">
              {a.value}
              {a.unit && <span className="ml-0.5 text-gold">{a.unit}</span>}
            </p>
            <p className="mt-1 text-sm text-muted">{a.label}</p>
            {a.explanation && <p className="sr-only">{a.explanation}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
