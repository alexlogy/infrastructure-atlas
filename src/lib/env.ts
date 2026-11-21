import { z } from 'zod'

const optionalUrl = z.preprocess((v) => (v === '' ? undefined : v), z.url().optional())
const optionalString = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional())

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URI: z.string().min(1, 'DATABASE_URI is required'),
  PAYLOAD_SECRET: z.string().min(1, 'PAYLOAD_SECRET is required'),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  GHOST_URL: optionalUrl,
  GHOST_CONTENT_API_KEY: optionalString,
  REVALIDATION_SECRET: optionalString,
})

export type ServerEnv = z.infer<typeof serverSchema>

const PLACEHOLDER_SECRET = 'replace-with-a-long-random-secret'

/** Validates server-only configuration. Throws with every problem listed, never echoing values. */
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverSchema.safeParse(source)
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    throw new Error(`Invalid environment configuration:\n- ${problems.join('\n- ')}`)
  }
  const env = result.data
  // Production must never run with a weak or example secret.
  if (
    env.NODE_ENV === 'production' &&
    (env.PAYLOAD_SECRET.length < 32 || env.PAYLOAD_SECRET === PLACEHOLDER_SECRET)
  ) {
    throw new Error(
      'Invalid environment configuration:\n- PAYLOAD_SECRET must be a unique value of at least 32 characters in production',
    )
  }
  return env
}
