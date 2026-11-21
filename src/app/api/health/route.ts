import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

/** Liveness + database readiness. Returns only a status string; errors are never echoed. */
export async function GET() {
  try {
    const payload = await getPayload({ config })
    // Cheapest typed round-trip to Postgres; the count itself is discarded.
    await payload.count({ collection: 'users', overrideAccess: true })
    return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    console.error('[health] database check failed')
    return Response.json(
      { status: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
