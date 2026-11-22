import type { LabProjectView } from '@/types/view-models'

export const LAB_STATUSES = ['active', 'exploring', 'paused', 'archived'] as const
export type LabStatus = (typeof LAB_STATUSES)[number]

/** The entry that leads the Lab page: the first featured one, else the first. */
export const leadLabProject = (projects: LabProjectView[]): LabProjectView | null =>
  projects.find((p) => p.featured) ?? projects[0] ?? null

/** Every tag in use, A–Z, for the filter. */
export const labTags = (projects: LabProjectView[]): string[] =>
  [...new Set(projects.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b))

/** The requested tag if it is in use (so unknown values can't produce an empty page). */
export function pickLabTag(
  tags: string[],
  requested: string | string[] | undefined,
): string | null {
  const tag = Array.isArray(requested) ? requested[0] : requested
  return tag && tags.includes(tag) ? tag : null
}
