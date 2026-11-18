import type { PlanInput } from '@menucart/shared'
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InferResponseType } from 'hono/client'
import { ApiError, api } from '../../lib/api.ts'
import type { Grocery } from '../groceries/queries.ts'

/** A plan with its menus and groceries, as the API returns it. */
export type Plan = InferResponseType<(typeof api.plans)[':id']['$get'], 200>
export type PlanMenu = Plan['menus'][number]
export type PlannableMenu = PlanMenu['menu']

export const planKeys = {
  all: ['plans'] as const,
  current: (today: string) => ['plans', 'current', today] as const,
  suggestion: (today: string) => ['plans', 'suggestion', today] as const,
}

/** For writes whose answer is not used: fails on any 4xx or 5xx. */
const ensureOk = (response: Response) => {
  if (!response.ok) {
    throw new ApiError(response.status)
  }
}

/** The plan the user is in today, or `null` when there is none yet. */
export const currentPlanQueryOptions = (today: string) =>
  queryOptions({
    queryKey: planKeys.current(today),
    queryFn: async () => {
      const response = await api.plans.current.$get({ query: { today } })
      if (!response.ok) {
        throw new ApiError(response.status)
      }
      return response.json()
    },
  })

/** Dates proposed for a new plan. */
export const planSuggestionQueryOptions = (today: string) =>
  queryOptions({
    queryKey: planKeys.suggestion(today),
    queryFn: async () => {
      const response = await api.plans.suggestion.$get({ query: { today } })
      if (!response.ok) {
        throw new ApiError(response.status)
      }
      return response.json()
    },
  })

/** Creates a plan. Overlapping dates fail with an `ApiError` with status 409. */
export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PlanInput) => {
      const response = await api.plans.$post({ json: input })
      if (!response.ok) {
        throw new ApiError(response.status)
      }
      return response.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKeys.all }),
  })
}

/**
 * Changes a cached plan right away, before the server answers, so the screen feels instant.
 * If the server fails, the previous plan is put back. Mutations of the same kind share a
 * `scope`, so they are sent one after another: fast taps can never arrive out of order.
 */
function useOptimisticPlanMutation<Variables>(
  today: string,
  kind: string,
  send: (variables: Variables) => Promise<void>,
  apply: (plan: Plan, variables: Variables) => Plan,
) {
  const queryClient = useQueryClient()
  const key = planKeys.current(today)

  return useMutation({
    scope: { id: `plan-${kind}` },
    mutationFn: send,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Plan | null>(key)
      queryClient.setQueryData<Plan | null>(key, (plan) => plan && apply(plan, variables))
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous)
    },
    // Refresh from the server without waiting for it: the mutation must finish (and show an error)
    // right away, even when the network is slow.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all })
    },
  })
}

/** Plans a menu `times` times; 0 removes it from the plan. */
export function useSetPlanMenu(today: string, planId: string) {
  return useOptimisticPlanMutation<{ menu: PlannableMenu; times: number }>(
    today,
    'menus',
    async ({ menu, times }) => {
      const param = { id: planId, menuId: menu.id }
      ensureOk(
        times > 0
          ? await api.plans[':id'].menus[':menuId'].$put({ param, json: { times } })
          : await api.plans[':id'].menus[':menuId'].$delete({ param }),
      )
    },
    (plan, { menu, times }) => {
      const others = plan.menus.filter((planned) => planned.menuId !== menu.id)
      const exists = others.length < plan.menus.length
      if (times === 0) {
        return { ...plan, menus: others }
      }
      return {
        ...plan,
        menus: exists
          ? plan.menus.map((planned) =>
              planned.menuId === menu.id ? { ...planned, times } : planned,
            )
          : [...plan.menus, { menuId: menu.id, times, menu }],
      }
    },
  )
}

/** Checks a grocery with the quantity to buy; `null` unchecks it. */
export function useSetPlanGrocery(today: string, planId: string) {
  return useOptimisticPlanMutation<{ grocery: Grocery; quantity: number | null }>(
    today,
    'groceries',
    async ({ grocery, quantity }) => {
      const param = { id: planId, groceryId: grocery.id }
      ensureOk(
        quantity === null
          ? await api.plans[':id'].groceries[':groceryId'].$delete({ param })
          : await api.plans[':id'].groceries[':groceryId'].$put({ param, json: { quantity } }),
      )
    },
    (plan, { grocery, quantity }) => {
      const others = plan.groceries.filter((checked) => checked.groceryId !== grocery.id)
      if (quantity === null) {
        return { ...plan, groceries: others }
      }
      const current = plan.groceries.find((checked) => checked.groceryId === grocery.id)
      return {
        ...plan,
        groceries: current
          ? plan.groceries.map((checked) =>
              checked.groceryId === grocery.id ? { ...checked, quantity } : checked,
            )
          : [
              ...plan.groceries,
              {
                id: `pending-${grocery.id}`,
                groceryId: grocery.id,
                name: grocery.name,
                category: grocery.category,
                unit: grocery.unit,
                quantity,
              },
            ],
      }
    },
  )
}
