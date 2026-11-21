import { formatDate } from '@/lib/dates'
import type { GhostPostView } from '@/types/view-models'

/** Links to the canonical article on the blog; the portfolio never copies the body. */
export function PostCard({ post, locale }: { post: GhostPostView; locale: string }) {
  const headingId = `post-${post.id}`

  return (
    <article
      aria-labelledby={headingId}
      className="relative flex h-full flex-col rounded-lg border border-line bg-surface p-6 focus-within:ring-2 focus-within:ring-accent"
    >
      {post.image && (
        // Plain <img>: the blog's image host is runtime configuration, not a build-time
        // next/image remote pattern. Lazy and async so cards never block the page.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image.url}
          alt={post.image.alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="mb-4 aspect-video w-full rounded-md object-cover"
        />
      )}
      <p className="text-sm text-muted">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, 'day', locale)}</time>
        {post.readingTime ? <span> · {post.readingTime} min read</span> : null}
      </p>
      <h3 id={headingId} className="mt-2 text-lg font-semibold text-ink">
        <a
          href={post.url}
          rel="noopener noreferrer"
          className="after:absolute after:inset-0 hover:text-accent focus:outline-none"
        >
          {post.title}
          <span className="sr-only"> (on the original blog)</span>
        </a>
      </h3>
      {post.excerpt && <p className="mt-2 leading-relaxed text-muted">{post.excerpt}</p>}
      {post.tags.length > 0 && (
        <ul aria-label="Tags" className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
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
