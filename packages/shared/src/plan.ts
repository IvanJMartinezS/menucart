import { z } from 'zod'

/**
 * A plan ("quincena") covers the days between two dates chosen by the user, for example
 * from the 2nd to the 16th. Plans cannot overlap, but there can be gaps between them.
 *
 * Dates are `YYYY-MM-DD` strings, never `Date` objects, so time zones can never move a day.
 * In that format, comparing the strings compares the dates.
 */
export type PlanPeriod = {
  startDate: string
  endDate: string
}

/** Length suggested for a new plan: 15 days, both ends included. */
export const DEFAULT_PLAN_DAYS = 15

/** Longest plan allowed, both ends included. */
export const MAX_PLAN_DAYS = 31

const toUtc = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number]
  return Date.UTC(year, month - 1, day)
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

/** The date `days` days after (or before, if negative) the given one. */
export const addDays = (isoDate: string, days: number) =>
  new Date(toUtc(isoDate) + days * DAY_IN_MS).toISOString().slice(0, 10)

/** Number of days of a plan, counting both the first and the last day. */
export const planLength = ({ startDate, endDate }: PlanPeriod) =>
  Math.round((toUtc(endDate) - toUtc(startDate)) / DAY_IN_MS) + 1

/**
 * Dates proposed for a new plan; the user can change them.
 * It starts the day after the previous plan ends, or today if that day has already passed
 * (or there is no previous plan), and lasts 15 days.
 */
export function suggestNextPlan(today: string, previous?: PlanPeriod): PlanPeriod {
  const dayAfterPrevious = previous ? addDays(previous.endDate, 1) : today
  const startDate = dayAfterPrevious > today ? dayAfterPrevious : today

  return { startDate, endDate: addDays(startDate, DEFAULT_PLAN_DAYS - 1) }
}

/** Data needed to create or change a plan: its first and last day. */
export const planInputSchema = z
  .object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  })
  .refine((plan) => plan.endDate >= plan.startDate, {
    message: 'A plan cannot end before it starts',
    path: ['endDate'],
  })
  .refine((plan) => plan.endDate < plan.startDate || planLength(plan) <= MAX_PLAN_DAYS, {
    message: `A plan lasts ${MAX_PLAN_DAYS} days at most`,
    path: ['endDate'],
  })

export type PlanInput = z.infer<typeof planInputSchema>

/** How many times a menu is planned in a plan (the same menu can be repeated). */
export const planMenuInputSchema = z.object({
  times: z.number().int().min(1).max(MAX_PLAN_DAYS),
})

export type PlanMenuInput = z.infer<typeof planMenuInputSchema>

/** Matches the database column `numeric(8, 2)`: up to 999999.99 with two decimals. */
const MAX_QUANTITY = 999_999.99

/** The amount of a grocery to buy in a plan. It starts as the grocery's default quantity. */
export const planGroceryInputSchema = z.object({
  quantity: z.number().positive().max(MAX_QUANTITY).multipleOf(0.01),
})

export type PlanGroceryInput = z.infer<typeof planGroceryInputSchema>
