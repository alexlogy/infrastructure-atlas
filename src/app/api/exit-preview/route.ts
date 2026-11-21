import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { toSafeLocalPath } from '@/lib/validation/links'

export const dynamic = 'force-dynamic'

/** Turns draft preview off and returns to a same-site path (default: home). */
export async function GET(request: Request) {
  ;(await draftMode()).disable()
  redirect(toSafeLocalPath(new URL(request.url).searchParams.get('path')) ?? '/')
}
