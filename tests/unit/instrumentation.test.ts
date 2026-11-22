import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { register } from '@/instrumentation'

let root: string

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'atlas-cache-'))
  vi.spyOn(process, 'cwd').mockReturnValue(root)
  vi.stubEnv('NEXT_RUNTIME', 'nodejs')
})

afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  await rm(root, { recursive: true, force: true })
})

async function seed(...dirs: string[]) {
  const dir = path.join(root, ...dirs)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'entry'), '{}')
}

test('server start empties the production data cache and leaves the rest of .next alone', async () => {
  vi.stubEnv('NODE_ENV', 'production')
  await seed('.next', 'cache', 'fetch-cache')
  await seed('.next', 'cache', 'images')
  await register()
  expect(await readdir(path.join(root, '.next', 'cache'))).toEqual(['images'])
})

test('in development it empties the dev data cache', async () => {
  vi.stubEnv('NODE_ENV', 'development')
  await seed('.next', 'dev', 'cache', 'fetch-cache')
  await register()
  expect(await readdir(path.join(root, '.next', 'dev', 'cache'))).toEqual([])
})

test('a missing cache is fine, and the edge runtime does nothing', async () => {
  await expect(register()).resolves.toBeUndefined()
  vi.stubEnv('NEXT_RUNTIME', 'edge')
  await seed('.next', 'cache', 'fetch-cache')
  await register()
  expect(await readdir(path.join(root, '.next', 'cache'))).toEqual(['fetch-cache'])
})
