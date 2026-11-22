/** The requested tag if it is in use, so unknown or repeated `?tag=` values never empty a page. */
export function pickTag(tags: string[], requested: string | string[] | undefined): string | null {
  const tag = Array.isArray(requested) ? requested[0] : requested
  return tag && tags.includes(tag) ? tag : null
}
