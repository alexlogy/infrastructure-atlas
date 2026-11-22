import type { Access, PayloadRequest } from 'payload'

const PUBLISHED = { _status: { equals: 'published' } } as const

/**
 * IDs of media used by content anonymous visitors can see. Every upload field
 * that points at `media` must be listed here; tests/int guards against a new
 * field being missed. Reads run as an anonymous visitor (`overrideAccess: false`).
 */
async function loadPublishedMediaIds(req: PayloadRequest): Promise<number[]> {
  const { payload } = req
  const list = { overrideAccess: false, draft: false, depth: 0, pagination: false } as const
  const single = { overrideAccess: false, depth: 0 } as const
  const [milestones, projects, home, site, about] = await Promise.all([
    payload.find({
      collection: 'timeline-milestones',
      where: PUBLISHED,
      select: { image: true },
      ...list,
    }),
    payload.find({
      collection: 'impact-projects',
      where: PUBLISHED,
      select: { featuredImage: true, diagram: true },
      ...list,
    }),
    payload.findGlobal({ slug: 'home-page', select: { heroImage: true }, ...single }),
    payload.findGlobal({ slug: 'site-settings', select: { shareImage: true }, ...single }),
    payload.findGlobal({ slug: 'about-page', select: { portrait: true }, ...single }),
  ])
  return [
    ...milestones.docs.map((d) => d.image),
    ...projects.docs.flatMap((d) => [d.featuredImage, d.diagram]),
    home.heroImage,
    site.shareImage,
    about.portrait,
  ].filter((id): id is number => typeof id === 'number')
}

/**
 * Media read rule, applied to records and to file downloads (`/api/media/file/*`).
 * Editors read everything; anonymous visitors only media that published content
 * uses, so an image attached only to a draft (or to nothing) is not public.
 */
export const publishedMediaOrAuthenticated: Access = async ({ req }) => {
  if (req.user) return true
  // Population checks access once per media doc; share one lookup per request.
  const memo = req.context as { publishedMediaIds?: Promise<number[]> }
  memo.publishedMediaIds ??= loadPublishedMediaIds(req)
  const ids = await memo.publishedMediaIds
  // With nothing published, match no rows (an empty list) rather than throwing Forbidden.
  return ids.length > 0 ? { id: { in: ids } } : { id: { exists: false } }
}
