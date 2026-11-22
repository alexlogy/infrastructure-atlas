import type { GhostPostView } from '@/types/view-models'

/**
 * Orders posts for the Writing page: the first featured post leads, then the remaining featured
 * posts and the recent ones, without repeats. With a tag chosen, only posts carrying it are listed
 * and nothing leads.
 */
export function arrangePosts(
  featured: GhostPostView[],
  recent: GhostPostView[],
  tag: string | null,
): { lead: GhostPostView | null; rest: GhostPostView[] } {
  const all = [...featured, ...recent].filter(
    (post, i, list) => list.findIndex((p) => p.id === post.id) === i,
  )
  if (tag) return { lead: null, rest: all.filter((p) => p.tags.includes(tag)) }
  return { lead: all[0] ?? null, rest: all.slice(1) }
}

/** Tags used by at least one listed post, A–Z. */
export const postTags = (posts: GhostPostView[]): string[] =>
  [...new Set(posts.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b))
