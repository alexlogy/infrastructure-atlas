import { revalidateTag } from 'next/cache'

import { CACHE_TAGS } from '@/lib/cache/tags'
import { parseServerEnv } from '@/lib/env'
import { verifyGhostSignature } from '@/lib/ghost/webhook'

export const dynamic = 'force-dynamic'

// Ghost post payloads include the rendered article, so allow generous bodies, but not unbounded ones.
const MAX_BODY_BYTES = 5 * 1024 * 1024

const reply = (status: number) =>
  new Response(null, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * Ghost webhook target: expires the cached post list so a published, updated
 * or deleted post shows on the next visit. Disabled (404) unless
 * REVALIDATION_SECRET is set; every delivery must carry a valid signature.
 * The payload itself is never read or logged; it only proves the signature.
 */
export async function POST(request: Request) {
  const secret = parseServerEnv(process.env).REVALIDATION_SECRET
  if (!secret) return reply(404)

  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return reply(413)
  const body = await request.text()
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) return reply(413)

  if (!verifyGhostSignature(request.headers.get('x-ghost-signature'), body, secret)) {
    console.warn('[ghost-webhook] rejected a delivery with a missing or invalid signature')
    return reply(401)
  }

  revalidateTag(CACHE_TAGS.ghost, { expire: 0 })
  return reply(204)
}
