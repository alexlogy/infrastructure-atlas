import type { DatePrecision } from '@/types/view-models'

const OPTIONS: Record<DatePrecision, Intl.DateTimeFormatOptions> = {
  year: { year: 'numeric', timeZone: 'UTC' },
  month: { year: 'numeric', month: 'short', timeZone: 'UTC' },
  day: { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' },
}

/** Formats a date at the editor-chosen precision. UTC avoids off-by-one-day shifts. */
export function formatDate(iso: string, precision: DatePrecision, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, OPTIONS[precision]).format(new Date(iso))
}

/** "Mar 2020", or "Mar 2020 – Jun 2022"; a range that collapses to one label shows once. */
export function formatDateRange(
  start: string,
  end: string | null,
  precision: DatePrecision,
  locale = 'en',
): string {
  const from = formatDate(start, precision, locale)
  if (!end) return from
  const to = formatDate(end, precision, locale)
  return from === to ? from : `${from} – ${to}`
}
