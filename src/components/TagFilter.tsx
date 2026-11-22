import Link from 'next/link'

/** Tag filter as plain links (`?tag=`), so it works without JavaScript and each view is linkable. */
export function TagFilter({
  basePath,
  tags,
  active,
}: {
  basePath: string
  tags: string[]
  active: string | null
}) {
  if (tags.length < 2) return null
  return (
    <nav aria-label="Filter by tag">
      <ul className="flex flex-wrap gap-2">
        {[null, ...tags].map((t) => (
          <li key={t ?? 'all'}>
            <Link
              href={t ? `${basePath}?tag=${encodeURIComponent(t)}` : basePath}
              scroll={false}
              aria-current={t === active ? 'true' : undefined}
              className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm text-muted transition-colors duration-150 hover:border-accent hover:text-ink aria-[current=true]:border-accent aria-[current=true]:bg-accent/10 aria-[current=true]:text-ink"
            >
              {t ?? 'All'}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
