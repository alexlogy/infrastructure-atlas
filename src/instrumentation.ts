/**
 * Runs once when the server starts, before it handles requests. Next.js keeps the data cache
 * (`unstable_cache` entries) on disk but remembers expired tags only in memory, so after a restart
 * an entry for content deleted or unpublished since it was last rendered would be served again.
 * Starting from an empty data cache closes that gap; the first visits after a restart read the
 * database again.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  // Imported here so an edge bundle of this file never pulls in Node built-ins.
  const { rm } = await import('node:fs/promises')
  const path = await import('node:path')
  // shortcut: relies on Next's internal cache location; a shared cacheHandler would replace this
  // when the site runs as more than one instance.
  const dist = process.env.NODE_ENV === 'development' ? ['.next', 'dev'] : ['.next']
  await rm(path.join(process.cwd(), ...dist, 'cache', 'fetch-cache'), {
    recursive: true,
    force: true,
  })
}
