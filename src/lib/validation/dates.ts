/** An end date is optional, but when present it must not precede the start date. */
export function isValidDateRange(start?: string | null, end?: string | null): boolean {
  if (!start || !end) return true
  return new Date(end).getTime() >= new Date(start).getTime()
}
