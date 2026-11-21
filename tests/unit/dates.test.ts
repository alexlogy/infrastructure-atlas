import { describe, expect, it } from 'vitest'

import { formatDate, formatDateRange } from '@/lib/dates'
import { isValidDateRange } from '@/lib/validation/dates'

describe('formatDate', () => {
  it('formats at each precision in UTC (no off-by-one-day shifts)', () => {
    const iso = '2020-03-01T00:00:00.000Z'
    expect(formatDate(iso, 'year')).toBe('2020')
    expect(formatDate(iso, 'month')).toBe('Mar 2020')
    expect(formatDate(iso, 'day')).toBe('Mar 1, 2020')
  })

  it('respects the locale', () => {
    expect(formatDate('2020-03-01T00:00:00.000Z', 'month', 'en-GB')).toBe('Mar 2020')
    expect(formatDate('2020-03-01T00:00:00.000Z', 'day', 'en-GB')).toBe('1 Mar 2020')
  })
})

describe('formatDateRange', () => {
  it('shows a single date when there is no end date', () => {
    expect(formatDateRange('2020-03-01T00:00:00.000Z', null, 'month')).toBe('Mar 2020')
  })

  it('shows a range with an en dash', () => {
    expect(formatDateRange('2020-03-01T00:00:00.000Z', '2022-06-15T00:00:00.000Z', 'month')).toBe(
      'Mar 2020 – Jun 2022',
    )
  })

  it('collapses a range that is identical at the chosen precision', () => {
    expect(formatDateRange('2020-03-01T00:00:00.000Z', '2020-11-20T00:00:00.000Z', 'year')).toBe(
      '2020',
    )
  })
})

describe('isValidDateRange', () => {
  it('allows missing values and equal or later end dates', () => {
    expect(isValidDateRange(undefined, undefined)).toBe(true)
    expect(isValidDateRange('2020-01-01', null)).toBe(true)
    expect(isValidDateRange('2020-01-01', '2020-01-01')).toBe(true)
    expect(isValidDateRange('2020-01-01', '2021-01-01')).toBe(true)
  })

  it('rejects an end date before the start date', () => {
    expect(isValidDateRange('2021-01-01', '2020-12-31')).toBe(false)
  })
})
