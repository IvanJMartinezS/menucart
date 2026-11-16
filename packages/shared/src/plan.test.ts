import { describe, expect, it } from 'vitest'
import {
  addDays,
  planGroceryInputSchema,
  planInputSchema,
  planLength,
  planMenuInputSchema,
  suggestNextPlan,
} from './plan.ts'

describe('addDays', () => {
  it.each([
    ['2026-11-02', 14, '2026-11-16'],
    ['2026-11-30', 1, '2026-12-01'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2026-03-01', -1, '2026-02-28'],
  ])('%s + %s days = %s', (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected)
  })
})

describe('planLength', () => {
  it.each([
    ['2026-11-02', '2026-11-16', 15],
    ['2026-11-17', '2026-11-30', 14],
    ['2026-01-31', '2026-02-14', 15],
    ['2026-11-10', '2026-11-10', 1],
  ])('from %s to %s is %s days, counting both ends', (startDate, endDate, days) => {
    expect(planLength({ startDate, endDate })).toBe(days)
  })
})

describe('suggestNextPlan', () => {
  it('starts the day after the previous plan and lasts 15 days', () => {
    const previous = { startDate: '2026-11-02', endDate: '2026-11-16' }

    expect(suggestNextPlan('2026-11-10', previous)).toEqual({
      startDate: '2026-11-17',
      endDate: '2026-12-01',
    })
  })

  it('starts today when the previous plan ended a while ago', () => {
    const previous = { startDate: '2026-09-01', endDate: '2026-09-15' }

    expect(suggestNextPlan('2026-11-20', previous)).toEqual({
      startDate: '2026-11-20',
      endDate: '2026-12-04',
    })
  })

  it('starts today when there is no previous plan', () => {
    expect(suggestNextPlan('2026-12-25')).toEqual({
      startDate: '2026-12-25',
      endDate: '2027-01-08',
    })
  })
})

describe('planInputSchema', () => {
  it.each([
    ['2026-11-02', '2026-11-16'],
    ['2026-11-17', '2026-11-30'],
    ['2026-01-31', '2026-02-14'],
    ['2026-11-10', '2026-11-10'],
    ['2026-11-01', '2026-12-01'],
  ])('accepts a plan from %s to %s', (startDate, endDate) => {
    expect(planInputSchema.safeParse({ startDate, endDate }).success).toBe(true)
  })

  it('rejects a plan that ends before it starts', () => {
    const result = planInputSchema.safeParse({ startDate: '2026-11-16', endDate: '2026-11-02' })

    expect(result.error?.issues.map(({ path, message }) => [path.join('.'), message])).toEqual([
      ['endDate', 'A plan cannot end before it starts'],
    ])
  })

  it('rejects a plan longer than 31 days', () => {
    const result = planInputSchema.safeParse({ startDate: '2026-11-01', endDate: '2026-12-02' })

    expect(result.error?.issues.map(({ message }) => message)).toEqual([
      'A plan lasts 31 days at most',
    ])
  })

  it.each(['2026-13-01', '16/11/2026', 'tomorrow', ''])('rejects the date %s', (date) => {
    expect(planInputSchema.safeParse({ startDate: date, endDate: '2026-11-16' }).success).toBe(
      false,
    )
  })
})

describe('planMenuInputSchema', () => {
  it.each([1, 2, 31])('accepts planning a menu %s times', (times) => {
    expect(planMenuInputSchema.safeParse({ times }).success).toBe(true)
  })

  it.each([0, -1, 1.5, 32])('rejects planning a menu %s times', (times) => {
    expect(planMenuInputSchema.safeParse({ times }).success).toBe(false)
  })
})

describe('planGroceryInputSchema', () => {
  it.each([1, 0.5, 2.25])('accepts the quantity %s', (quantity) => {
    expect(planGroceryInputSchema.safeParse({ quantity }).success).toBe(true)
  })

  it.each([0, -1, 1.234])('rejects the quantity %s', (quantity) => {
    expect(planGroceryInputSchema.safeParse({ quantity }).success).toBe(false)
  })
})
