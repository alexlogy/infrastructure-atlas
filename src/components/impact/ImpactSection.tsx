import { dashboardProjects, pickProject } from '@/lib/impact'
import { getPublicProject } from '@/lib/payload/public'
import { selectPerspective } from '@/lib/perspective'
import type { AtlasView, ProjectSummaryView } from '@/types/view-models'

import { ImpactDashboard } from './ImpactDashboard'

/** Loads the selected case study for the dashboard from `?project=` and `?view=`. */
export async function ImpactSection({
  projects,
  chosenIds,
  query,
  basePath,
  atlas,
  heading,
}: {
  projects: ProjectSummaryView[]
  chosenIds: string[]
  query: { project?: string | string[]; view?: string | string[] }
  basePath: string
  atlas: AtlasView | null
  heading?: 'h2' | 'h3'
}) {
  const tiles = dashboardProjects(projects, chosenIds)
  const pick = pickProject(tiles, query.project)
  const selected = pick && (await getPublicProject(pick.slug))
  if (!selected) return null
  const perspective = selectPerspective(query.view, {
    leadership: Boolean(selected.leadershipNarrative),
    engineering: Boolean(selected.engineeringNarrative),
  })
  return (
    <ImpactDashboard
      projects={tiles}
      selected={selected}
      perspective={perspective}
      basePath={basePath}
      atlas={atlas}
      heading={heading}
    />
  )
}
