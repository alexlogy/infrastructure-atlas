import Image from 'next/image'

import { PROSE_CLASS, RichText } from '@/components/RichText'
import { formatDateRange } from '@/lib/dates'
import type { MilestoneView } from '@/types/view-models'

export function MilestoneCard({
  milestone,
  locale,
  unoptimizedImages = false,
}: {
  milestone: MilestoneView
  locale: string
  unoptimizedImages?: boolean
}) {
  const { title, subtitle, startDate, endDate, datePrecision, description, era, tags, image } =
    milestone
  const headingId = `milestone-${milestone.id}`

  return (
    <article
      aria-labelledby={headingId}
      className={`reveal rounded-lg border bg-surface p-6 ${
        milestone.featured ? 'border-gold' : 'border-line'
      }`}
    >
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <time dateTime={startDate}>
          {formatDateRange(startDate, endDate, datePrecision, locale)}
        </time>
        {era && <span>· {era}</span>}
        {milestone.featured && <span className="font-medium text-gold">· Featured</span>}
      </p>
      <h2 id={headingId} className="mt-2 text-xl font-semibold text-ink">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}

      {image && (
        <figure className="mt-4">
          <Image
            src={image.url}
            alt={image.alt}
            width={image.width ?? 1200}
            height={image.height ?? 675}
            sizes="(min-width: 768px) 640px, 100vw"
            unoptimized={unoptimizedImages}
            className="h-auto w-full rounded-md"
          />
          {image.attribution && (
            <figcaption className="mt-2 text-xs text-muted">{image.attribution}</figcaption>
          )}
        </figure>
      )}

      {description && <RichText data={description} className={`mt-4 ${PROSE_CLASS}`} />}

      {tags.length > 0 && (
        <ul aria-label="Tags" className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-line px-3 py-0.5 text-xs text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
