import { describe, expect, it } from 'vitest'

import { dashboardProjects, MAX_DASHBOARD_PROJECTS, pickProject } from '@/lib/impact'
import type { ProjectSummaryView } from '@/types/view-models'

const project = (id: number, featured = false): ProjectSummaryView => ({
  id: String(id),
  slug: `sample-${id}`,
  title: `Sample project ${id}`,
  summary: 'Fictional.',
  category: null,
  icon: null,
  image: null,
  tags: [],
  featured,
  sortOrder: id,
  milestoneIds: [],
  locationIds: [],
})

describe('dashboardProjects', () => {
  const all = [project(1), project(2, true), project(3), project(4, true), project(5), project(6)]

  it('uses the home page order, dropping unpublished ids', () => {
    expect(dashboardProjects(all, ['3', '99', '1']).map((p) => p.id)).toEqual(['3', '1'])
  })

  it('falls back to featured projects, then to the first published ones', () => {
    expect(dashboardProjects(all, []).map((p) => p.id)).toEqual(['2', '4'])
    const plain = all.map((p) => ({ ...p, featured: false }))
    expect(dashboardProjects(plain, [])).toHaveLength(MAX_DASHBOARD_PROJECTS)
    expect(dashboardProjects([], [])).toEqual([])
  })
})

describe('pickProject', () => {
  const tiles = [project(1), project(2)]
  it('honours a requested tile and ignores anything else', () => {
    expect(pickProject(tiles, 'sample-2')?.id).toBe('2')
    expect(pickProject(tiles, ['sample-2', 'x'])?.id).toBe('2')
    expect(pickProject(tiles, 'not-a-tile')?.id).toBe('1')
    expect(pickProject([], 'sample-1')).toBeNull()
  })
})
