import { queryOptions } from '@tanstack/react-query'
import type { InferResponseType } from 'hono/client'
import { ApiError, api } from '../../lib/api.ts'

/** The shopping list of a plan, as the API returns it. */
export type ShoppingList = InferResponseType<
  (typeof api.plans)[':id']['shopping-list']['$get'],
  200
>
export type ShoppingSection = ShoppingList['sections'][number]
export type ShoppingItem = ShoppingSection['items'][number]

export const shoppingListQueryOptions = (planId: string) =>
  queryOptions({
    // Under the plan keys, so any change to the plan refreshes the list too.
    queryKey: ['plans', planId, 'shopping-list'],
    queryFn: async () => {
      const response = await api.plans[':id']['shopping-list'].$get({ param: { id: planId } })

      if (!response.ok) {
        throw new ApiError(response.status)
      }

      return response.json()
    },
  })
