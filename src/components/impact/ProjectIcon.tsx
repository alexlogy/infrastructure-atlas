import type { ProjectIconName } from '@/lib/project-icons'

// 24×24 line icons, 1.5 stroke, drawn with currentColor.
const PATHS: Record<ProjectIconName, string> = {
  cloud: 'M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 9.1 4.5 4.5 0 0 0 7 18Z',
  server: 'M4 5h16v5H4zM4 14h16v5H4zM8 7.5h.01M8 16.5h.01M12 7.5h4M12 16.5h4',
  network:
    'M12 4v5M12 15v5M5 12h5M14 12h5M9 9h6v6H9zM3 3h4v4H3zM17 3h4v4h-4zM3 17h4v4H3zM17 17h4v4h-4z',
  shield: 'M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3ZM9 12l2 2 4-4',
  chart: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6',
  people:
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a6 6 0 0 1 12 0M16 11a2.5 2.5 0 1 0 0-5M17 14.5a5 5 0 0 1 4 5.5',
  code: 'm8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14',
  layers: 'm12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17l9 5 9-5',
}

export function ProjectIcon({
  name,
  className = 'h-6 w-6',
}: {
  name: ProjectIconName | null
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={PATHS[name ?? 'layers']} />
    </svg>
  )
}
