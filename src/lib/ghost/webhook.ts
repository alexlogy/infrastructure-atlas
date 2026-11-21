import { createHmac, timingSafeEqual } from 'node:crypto'

/** Signed deliveries older (or newer) than this are rejected as replays. */
export const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000

/**
 * Verifies Ghost's integration webhook header,
 * `X-Ghost-Signature: sha256=<hex HMAC-SHA256(secret, body + t)>, t=<epoch ms>`,
 * against the raw request body. Constant-time comparison; stale timestamps fail.
 */
export function verifyGhostSignature(
  header: string | null,
  body: string,
  secret: string,
  now = Date.now(),
): boolean {
  const match = header?.match(/^sha256=([0-9a-f]{64}), t=(\d{1,16})$/)
  if (!match) return false
  const [, signature, timestamp] = match
  if (Math.abs(now - Number(timestamp)) > SIGNATURE_TOLERANCE_MS) return false
  const expected = createHmac('sha256', secret).update(`${body}${timestamp}`).digest()
  return timingSafeEqual(Buffer.from(signature, 'hex'), expected)
}
