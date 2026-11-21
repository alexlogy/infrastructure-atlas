import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PostCard } from '@/components/writing/PostCard'
import { getGhostPosts, ghostConfig } from '@/lib/ghost'
import { pageMetadata } from '@/lib/metadata'
import { getSiteSettings, getWritingSettings } from '@/lib/payload/public'
import type { GhostPostView } from '@/types/view-models'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Writing',
    description: 'Recent articles, linked to where they were first published.',
    path: '/writing',
  })
}

export default async function WritingPage() {
  const [settings, writing] = await Promise.all([getSiteSettings(), getWritingSettings()])
  if (!ghostConfig || !writing.enabled) notFound()

  const { featured, recent, status } = await getGhostPosts(writing)
  const empty = featured.length === 0 && recent.length === 0

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24" aria-labelledby="writing-heading">
      <h1 id="writing-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Writing
      </h1>
      <p className="mt-3 text-muted">
        Recent articles. Each one opens on the blog where it was first published.
      </p>

      {empty ? (
        <div className="mt-12 rounded-lg border border-dashed border-line p-8 text-muted">
          <p>
            {status === 'unavailable'
              ? 'Articles are temporarily unavailable. Please try again later.'
              : 'No articles have been published yet.'}
          </p>
        </div>
      ) : (
        <>
          <PostGroup id="featured" title="Featured" posts={featured} locale={settings.locale} />
          <PostGroup id="recent" title="Recent" posts={recent} locale={settings.locale} />
        </>
      )}
    </section>
  )
}

function PostGroup({
  id,
  title,
  posts,
  locale,
}: {
  id: string
  title: string
  posts: GhostPostView[]
  locale: string
}) {
  if (posts.length === 0) return null
  return (
    <section aria-labelledby={`${id}-posts-heading`} className="mt-12">
      <h2 id={`${id}-posts-heading`} className="text-2xl font-semibold">
        {title}
      </h2>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} locale={locale} />
          </li>
        ))}
      </ul>
    </section>
  )
}
