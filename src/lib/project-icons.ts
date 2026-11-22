/** Generic line icons an editor can pick for a project tile (drawn in ProjectIcon.tsx). */
export const PROJECT_ICONS = [
  'cloud',
  'server',
  'network',
  'shield',
  'chart',
  'people',
  'code',
  'layers',
] as const

export type ProjectIconName = (typeof PROJECT_ICONS)[number]
