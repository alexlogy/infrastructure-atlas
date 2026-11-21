import Image from 'next/image'

import { RichText } from '@/components/RichText'
import { formatDateRange } from '@/lib/dates'
import type { MilestoneView } from '@/types/view-models'

export function MilestoneCard({ milestone, locale }: { milestone: MilestoneView; locale: string }) {
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
            className="h-auto w-full rounded-md"
          />
          {image.attribution && (
            <figcaption className="mt-2 text-xs text-muted">{image.attribution}</figcaption>
          )}
        </figure>
      )}

      {description && (
        <RichText
          data={description}
          className="mt-4 space-y-3 leading-relaxed text-ink/90 [&_a]:text-accent [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
        />
      )}

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
