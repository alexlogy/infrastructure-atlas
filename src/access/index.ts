import type { Access, FieldAccess } from 'payload'

import type { User } from '@/payload-types'

type MaybeUser = User | null | undefined

export const isAdminUser = (user: MaybeUser): boolean => user?.role === 'admin'

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/** Gate for the /admin panel (must return a plain boolean). */
export const canAccessAdmin = ({ req: { user } }: { req: { user: unknown } }): boolean =>
  Boolean(user)

export const anyone: Access = () => true

export const adminOnly: Access = ({ req: { user } }) => isAdminUser(user)

export const adminOnlyField: FieldAccess = ({ req: { user } }) => isAdminUser(user)

/** Admins see every user; editors see only themselves. Anonymous: nothing. */
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdminUser(user)) return true
  return { id: { equals: user.id } }
}

/** Anonymous readers only ever match published documents; signed-in editors see drafts too. */
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
