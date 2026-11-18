import { describe, expect, it } from 'vitest'
import { formatShortDate, todayIso } from './dates.ts'

describe('todayIso', () => {
  it('uses the local calendar day, even late in the evening', () => {
    // 11 p.m. on 17 November in the user's time zone (UTC would already say the 18th in Venezuela).
    expect(todayIso(new Date(2026, 10, 17, 23, 0))).toBe('2026-11-17')
  })

  it('pads months and days', () => {
    expect(todayIso(new Date(2027, 0, 5, 9, 0))).toBe('2027-01-05')
  })
})

describe('formatShortDate', () => {
  it('shows the day and the short month in the language', () => {
    expect(formatShortDate('2026-11-17', 'es')).toMatch(/^17 nov/)
    expect(formatShortDate('2026-11-17', 'en')).toBe('Nov 17')
  })

  it('never moves the date to another day', () => {
    expect(formatShortDate('2026-12-01', 'en')).toBe('Dec 1')
    expect(formatShortDate('2026-12-31', 'en')).toBe('Dec 31')
  })
})
