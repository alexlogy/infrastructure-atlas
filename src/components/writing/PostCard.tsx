import { formatDate } from '@/lib/dates'
import type { GhostPostView } from '@/types/view-models'

/**
 * The article's image at 16:9, or a quiet branded panel when it has none, so a grid stays even.
 * Plain <img>: the blog's image host is runtime configuration, not a build-time next/image
 * remote pattern. Lazy and async so cards never block the page.
 */
function PostImage({ post, eager = false }: { post: GhostPostView; eager?: boolean }) {
  if (!post.image) {
    return (
      <div
        aria-hidden="true"
        className="flex aspect-video w-full items-end bg-[radial-gradient(circle_at_80%_20%,rgb(101_214_223/0.18),transparent_55%),linear-gradient(135deg,var(--color-raised),var(--color-deep))] p-4"
      >
        {post.tags[0] && (
          <span className="font-display text-sm tracking-wide text-muted uppercase">
            {post.tags[0]}
          </span>
        )}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={post.image.url}
      alt={post.image.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      className="aspect-video w-full object-cover"
    />
  )
}

function Meta({ post, locale }: { post: GhostPostView; locale: string }) {
  return (
    <p className="text-sm text-muted">
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, 'day', locale)}</time>
      {post.readingTime ? <span> · {post.readingTime} min read</span> : null}
    </p>
  )
}

function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <ul aria-label="Tags" className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag} className="rounded-full border border-line px-3 py-0.5 text-xs text-muted">
          {tag}
        </li>
      ))}
    </ul>
  )
}

/** The title links to the canonical article on the blog; the portfolio never copies the body. */
function TitleLink({ post }: { post: GhostPostView }) {
  return (
    <a
      href={post.url}
      rel="noopener noreferrer"
      className="after:absolute after:inset-0 hover:text-accent focus:outline-none"
    >
      {post.title}
      <span className="sr-only"> (on the original blog)</span>
    </a>
  )
}

export function PostCard({
  post,
  locale,
  heading: H = 'h3',
}: {
  post: GhostPostView
  locale: string
  heading?: 'h2' | 'h3'
}) {
  return (
    <article
      aria-labelledby={`post-${post.id}`}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface focus-within:ring-2 focus-within:ring-accent"
    >
      <PostImage post={post} />
      <div className="flex flex-1 flex-col p-6">
        <Meta post={post} locale={locale} />
        <H id={`post-${post.id}`} className="mt-2 font-display text-lg font-semibold text-ink">
          <TitleLink post={post} />
        </H>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 flex-1 leading-relaxed text-muted">{post.excerpt}</p>
        )}
        <div className="mt-4">
          <Tags tags={post.tags} />
        </div>
      </div>
    </article>
  )
}

/** The lead story: a large image beside the title and excerpt. */
export function FeaturedPost({ post, locale }: { post: GhostPostView; locale: string }) {
  return (
    <article
      aria-labelledby={`post-${post.id}`}
      className="relative grid overflow-hidden rounded-3xl border border-line bg-surface focus-within:ring-2 focus-within:ring-accent lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      <PostImage post={post} eager />
      <div className="flex flex-col justify-center p-6 lg:p-10">
        <p className="eyebrow">Featured story</p>
        <div className="mt-3">
          <Meta post={post} locale={locale} />
        </div>
        <h2
          id={`post-${post.id}`}
          className="mt-2 font-display text-2xl leading-tight font-semibold text-ink lg:text-3xl"
        >
          <TitleLink post={post} />
        </h2>
        {post.excerpt && <p className="mt-4 leading-relaxed text-muted">{post.excerpt}</p>}
        <div className="mt-6">
          <Tags tags={post.tags} />
        </div>
        <p aria-hidden="true" className="mt-6 text-sm font-medium text-accent">
          Read on the blog →
        </p>
      </div>
    </article>
  )
}

export function PostGrid({
  posts,
  locale,
  heading,
}: {
  posts: GhostPostView[]
  locale: string
  heading?: 'h2' | 'h3'
}) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} locale={locale} heading={heading} />
        </li>
      ))}
    </ul>
  )
}
