import type { ProjectSummaryView } from '@/types/view-models'

/** Most tiles the dashboard's middle column shows. */
export const MAX_DASHBOARD_PROJECTS = 4

/**
 * Projects for the impact dashboard: the home page's chosen order when set, else projects marked
 * featured, else the first few published. Unpublished ids simply drop out.
 */
export function dashboardProjects(
  projects: ProjectSummaryView[],
  chosenIds: string[],
): ProjectSummaryView[] {
  const byId = new Map(projects.map((p) => [p.id, p]))
  const chosen = chosenIds.flatMap((id) => byId.get(id) ?? [])
  const featured = projects.filter((p) => p.featured)
  const list = chosen.length > 0 ? chosen : featured.length > 0 ? featured : projects
  return list.slice(0, MAX_DASHBOARD_PROJECTS)
}

/** The requested project when it is one of the tiles, otherwise the first tile. */
export function pickProject(
  tiles: ProjectSummaryView[],
  requested: string | string[] | undefined,
): ProjectSummaryView | null {
  const slug = Array.isArray(requested) ? requested[0] : requested
  return tiles.find((p) => p.slug === slug) ?? tiles[0] ?? null
}
