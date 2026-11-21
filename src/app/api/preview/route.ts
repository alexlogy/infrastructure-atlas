import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { toSafeLocalPath } from '@/lib/validation/links'

export const dynamic = 'force-dynamic'

const reply = (message: string, status: number) =>
  new Response(message, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * Turns on draft preview for a signed-in editor, then redirects to a same-site
 * path. No shared secret in the URL: the Payload session cookie is the credential,
 * and pages re-check it on every render.
 */
export async function GET(request: Request) {
  const path = toSafeLocalPath(new URL(request.url).searchParams.get('path'))
  if (!path) return reply('Invalid preview path.', 400)

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return reply('Sign in to the admin to preview drafts.', 401)

  ;(await draftMode()).enable()
  redirect(path)
}
