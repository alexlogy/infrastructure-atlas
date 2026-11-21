import { z } from 'zod'

import { isValidSlug } from '@/lib/validation/slugs'
import type { GhostPostView } from '@/types/view-models'

/**
 * Read-only Ghost Content API client. Framework-free (fetch is injected) so it
 * can be unit-tested; see ./index.ts for the cached server wrapper.
 * Never log request URLs: they carry the Content API key.
 */

export type GhostConfig = { url: string; key: string }

export type PostQuery =
  | { kind: 'recent'; limit: number; includeTags: string[]; excludeTags: string[]; skip: string[] }
  | { kind: 'featured'; slugs: string[] }

export const REQUEST_TIMEOUT_MS = 5000

// Only the fields the cards render; never the post HTML.
const FIELDS = [
  'id',
  'title',
  'slug',
  'url',
  'canonical_url',
  'custom_excerpt',
  'excerpt',
  'feature_image',
  'feature_image_alt',
  'published_at',
  'reading_time',
].join(',')

const httpUrl = z.string().refine((v) => /^https?:$/.test(safeProtocol(v)), 'not an http(s) URL')

function safeProtocol(value: string): string {
  try {
    return new URL(value).protocol
  } catch {
    return ''
  }
}

const postSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  slug: z.string().min(1),
  url: httpUrl,
  canonical_url: httpUrl.nullish().catch(null),
  custom_excerpt: z.string().nullish(),
  excerpt: z.string().nullish(),
  feature_image: httpUrl.nullish().catch(null),
  feature_image_alt: z.string().nullish(),
  published_at: z.iso.datetime({ offset: true }),
  reading_time: z.number().int().nonnegative().nullish(),
  tags: z
    .array(z.object({ name: z.string(), slug: z.string(), visibility: z.string().optional() }))
    .nullish(),
})

const responseSchema = z.object({ posts: z.array(z.unknown()) })

const EXCERPT_MAX = 280

function toPostView(raw: unknown): GhostPostView | null {
  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) return null
  const p = parsed.data
  const excerpt = (p.custom_excerpt || p.excerpt || '').replace(/\s+/g, ' ').trim()
  return {
    id: p.id,
    title: p.title.trim(),
    slug: p.slug,
    // The canonical URL wins: the portfolio links out instead of duplicating articles.
    url: p.canonical_url ?? p.url,
    excerpt: excerpt
      ? excerpt.length > EXCERPT_MAX
        ? `${excerpt.slice(0, EXCERPT_MAX - 1).trimEnd()}…`
        : excerpt
      : null,
    image: p.feature_image
      ? { url: p.feature_image, alt: p.feature_image_alt?.trim() ?? '' }
      : null,
    tags: (p.tags ?? []).filter((t) => t.visibility !== 'internal').map((t) => t.name),
    publishedAt: p.published_at,
    readingTime: p.reading_time ?? null,
  }
}

/** NQL list of validated slugs. Anything else is dropped, so editors cannot inject filter syntax. */
const slugSet = (slugs: string[]) => `[${slugs.filter(isValidSlug).join(',')}]`

export function buildPostsUrl(config: GhostConfig, query: PostQuery): URL {
  const base = config.url.endsWith('/') ? config.url : `${config.url}/`
  const url = new URL('ghost/api/content/posts/', base)
  const filters: string[] = []
  let limit: number

  if (query.kind === 'featured') {
    filters.push(`slug:${slugSet(query.slugs)}`)
    limit = query.slugs.length
  } else {
    if (query.includeTags.some(isValidSlug)) filters.push(`tag:${slugSet(query.includeTags)}`)
    if (query.excludeTags.some(isValidSlug)) filters.push(`tag:-${slugSet(query.excludeTags)}`)
    if (query.skip.some(isValidSlug)) filters.push(`slug:-${slugSet(query.skip)}`)
    limit = query.limit
  }

  url.searchParams.set('key', config.key)
  // One page is enough: limits are capped at 20, well under Ghost's page size.
  url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 20)))
  url.searchParams.set('fields', FIELDS)
  url.searchParams.set('include', 'tags')
  url.searchParams.set('order', 'published_at desc')
  if (filters.length) url.searchParams.set('filter', filters.join('+'))
  return url
}

export class GhostRequestError extends Error {
  constructor(reason: string) {
    // Deliberately no URL in the message: it contains the API key.
    super(`Ghost request failed: ${reason}`)
    this.name = 'GhostRequestError'
  }
}

export async function fetchPosts(
  config: GhostConfig,
  query: PostQuery,
  fetchImpl: typeof fetch,
  init: RequestInit = {},
): Promise<GhostPostView[]> {
  if (query.kind === 'featured' && !query.slugs.some(isValidSlug)) return []
  let response: Response
  try {
    response = await fetchImpl(buildPostsUrl(config, query), {
      ...init,
      headers: { 'Accept-Version': 'v5.0' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new GhostRequestError(
      error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'network error',
    )
  }
  if (!response.ok) throw new GhostRequestError(`HTTP ${response.status}`)

  const body = responseSchema.safeParse(await response.json().catch(() => null))
  if (!body.success) throw new GhostRequestError('unexpected response shape')
  const posts = body.data.posts.map(toPostView).filter((p): p is GhostPostView => p !== null)

  if (query.kind === 'featured') {
    // Keep the editor's order; renamed or deleted slugs simply drop out.
    const bySlug = new Map(posts.map((p) => [p.slug, p]))
    return query.slugs.flatMap((slug) => bySlug.get(slug) ?? [])
  }
  return posts
}

export type Freshness = 'ok' | 'stale' | 'unavailable'

/**
 * Wraps a loader with a last-known-good copy per argument set, so a Ghost
 * outage degrades to slightly old posts (or `empty`), never a broken page.
 */
export function withLastKnownGood<A extends unknown[], T>(
  load: (...args: A) => Promise<T>,
  empty: T,
  log: (message: string) => void = console.error,
) {
  const lastGood = new Map<string, T>()
  return async (...args: A): Promise<{ value: T; status: Freshness }> => {
    const key = JSON.stringify(args)
    try {
      const value = await load(...args)
      lastGood.set(key, value)
      return { value, status: 'ok' }
    } catch (error) {
      log(`[ghost] ${error instanceof GhostRequestError ? error.message : 'unexpected error'}`)
      const previous = lastGood.get(key)
      return previous !== undefined
        ? { value: previous, status: 'stale' }
        : { value: empty, status: 'unavailable' }
    }
  }
}
