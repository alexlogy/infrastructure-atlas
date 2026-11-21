import 'server-only'

import config from '@payload-config'
import { draftMode, headers } from 'next/headers'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import type { MilestoneView, ProjectView } from '@/types/view-models'

import { getPublicProject, getPublicTimeline } from './public'
import { fetchPublicProject, fetchPublicTimeline } from './queries'

/**
 * The signed-in editor, but only while draft mode is on. The Payload session is
 * re-verified on every request, so the draft-mode cookie alone (e.g. after
 * logging out) never reveals drafts.
 */
export async function getPreviewUser(): Promise<User | null> {
  if (!(await draftMode()).isEnabled) return null
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    return (user as User | null) ?? null
  } catch {
    return null
  }
}

/** Timeline for this request: drafts for a previewing editor, cached published data otherwise. */
export async function getTimeline(): Promise<MilestoneView[]> {
  const user = await getPreviewUser()
  return user ? fetchPublicTimeline(await getPayload({ config }), user) : getPublicTimeline()
}

/** Project for this request: latest draft for a previewing editor, cached published data otherwise. */
export async function getProject(slug: string): Promise<ProjectView | null> {
  const user = await getPreviewUser()
  return user
    ? fetchPublicProject(await getPayload({ config }), slug, user)
    : getPublicProject(slug)
}
