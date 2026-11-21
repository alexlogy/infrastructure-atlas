import 'server-only'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS } from '@/lib/cache/tags'
import { parseServerEnv } from '@/lib/env'
import type { GhostPostView, WritingSettingsView } from '@/types/view-models'

import { fetchPosts, type Freshness, type GhostConfig, withLastKnownGood } from './client'

/** Ghost refresh interval when no webhook is configured (seconds). */
export const GHOST_REVALIDATE_SECONDS = 900

const env = parseServerEnv(process.env)

/** Null when Ghost is not configured: the Writing section then stays hidden. */
export const ghostConfig: GhostConfig | null =
  env.GHOST_URL && env.GHOST_CONTENT_API_KEY
    ? { url: env.GHOST_URL, key: env.GHOST_CONTENT_API_KEY }
    : null

type Posts = { featured: GhostPostView[]; recent: GhostPostView[] }

// Errors are thrown, never cached, so a failed refresh keeps serving the previous entry.
// Only `settings` is an argument (and so part of the cache key); the API key never is.
const loadPosts = unstable_cache(
  async (settings: WritingSettingsView): Promise<Posts> => {
    const config = ghostConfig
    if (!config) return { featured: [], recent: [] }
    const [featured, recent] = await Promise.all([
      fetchPosts(config, { kind: 'featured', slugs: settings.featuredSlugs }, fetch, {
        cache: 'no-store',
      }),
      fetchPosts(
        config,
        {
          kind: 'recent',
          limit: settings.recentCount,
          includeTags: settings.includeTags,
          excludeTags: settings.excludeTags,
          skip: settings.featuredSlugs,
        },
        fetch,
        { cache: 'no-store' },
      ),
    ])
    return { featured, recent }
  },
  ['ghost-posts'],
  { revalidate: GHOST_REVALIDATE_SECONDS, tags: [CACHE_TAGS.ghost] },
)

const readPosts = withLastKnownGood(loadPosts, { featured: [], recent: [] })

export async function getGhostPosts(
  settings: WritingSettingsView,
): Promise<Posts & { status: Freshness }> {
  if (!ghostConfig) return { featured: [], recent: [], status: 'unavailable' }
  const { value, status } = await readPosts(settings)
  return { ...value, status }
}
