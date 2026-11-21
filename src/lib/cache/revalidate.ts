import { revalidateTag } from 'next/cache'
import type { PayloadRequest } from 'payload'

import type { CacheTag } from './tags'

/**
 * Expires a cache tag immediately so the next visitor sees the change.
 * Outside a Next.js request (CLI scripts, seeds, tests) there is no cache to
 * invalidate, so failures are logged without content and ignored.
 */
export function expireTag(tag: CacheTag, req: PayloadRequest): void {
  if (req.context?.disableRevalidate) return
  try {
    revalidateTag(tag, { expire: 0 })
  } catch {
    req.payload.logger.warn(
      `Skipped cache revalidation for tag "${tag}" (no Next.js request context)`,
    )
  }
}

type StatusDoc = { _status?: 'draft' | 'published' | null } | null | undefined

/** True when a change affects what anonymous visitors can see. Draft-only saves are skipped. */
export function affectsPublishedContent(doc: StatusDoc, previousDoc?: StatusDoc): boolean {
  return doc?._status === 'published' || previousDoc?._status === 'published'
}
