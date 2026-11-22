import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TagFilter } from '@/components/TagFilter'
import { FeaturedPost, PostGrid } from '@/components/writing/PostCard'
import { getGhostPosts, ghostConfig } from '@/lib/ghost'
import { pageMetadata } from '@/lib/metadata'
import { getSiteSettings, getWritingSettings } from '@/lib/payload/public'
import { pickTag } from '@/lib/tags'
import { arrangePosts, postTags } from '@/lib/writing'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Writing',
    description: 'Recent articles, linked to where they were first published.',
    path: '/writing',
  })
}

type Props = { searchParams: Promise<{ tag?: string | string[] }> }

export default async function WritingPage({ searchParams }: Props) {
  const [settings, writing] = await Promise.all([getSiteSettings(), getWritingSettings()])
  if (!ghostConfig || !writing.enabled) notFound()

  const { featured, recent, status } = await getGhostPosts(writing)
  const tags = postTags([...featured, ...recent])
  const tag = pickTag(tags, (await searchParams).tag)
  const { lead, rest } = arrangePosts(featured, recent, tag)
  const empty = !lead && rest.length === 0

  return (
    <section className="container-page section-y" aria-labelledby="writing-heading">
      <p className="eyebrow">Writing</p>
      <h1 id="writing-heading" className="mt-3 text-page font-semibold">
        Writing
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Recent articles. Each one opens on the blog where it was first published.
      </p>

      {empty ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line p-8 text-muted">
          <p>
            {status === 'unavailable'
              ? 'Articles are temporarily unavailable. Please try again later.'
              : 'No articles have been published yet.'}
          </p>
        </div>
      ) : (
        <>
          {lead && (
            <div className="mt-12">
              <FeaturedPost post={lead} locale={settings.locale} />
            </div>
          )}

          <div className="mt-12">
            <TagFilter basePath="/writing" tags={tags} active={tag} />
          </div>

          {rest.length > 0 && (
            <section aria-labelledby="more-writing-heading" className="mt-8">
              <h2 id="more-writing-heading" className="sr-only">
                {tag ? `Articles tagged ${tag}` : 'More articles'}
              </h2>
              <PostGrid posts={rest} locale={settings.locale} />
            </section>
          )}
        </>
      )}
    </section>
  )
}
