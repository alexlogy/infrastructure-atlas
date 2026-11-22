export type CredentialStatus = 'current' | 'expired' | 'no-expiry'

/** Derived at render time, so a credential is never shown as current after its expiry date. */
export function credentialStatus(
  expiresOn: string | null,
  now: Date = new Date(),
): CredentialStatus {
  if (!expiresOn) return 'no-expiry'
  return new Date(expiresOn).getTime() < now.getTime() ? 'expired' : 'current'
}
