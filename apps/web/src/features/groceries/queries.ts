import type { GroceryInput } from '@menucart/shared'
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InferResponseType } from 'hono/client'
import { ApiError, api } from '../../lib/api.ts'

/** A grocery as the API returns it. The type comes from the API code. */
export type Grocery = InferResponseType<typeof api.groceries.$get, 200>[number]

const groceryKeys = {
  all: ['groceries'] as const,
}

/** Every grocery, grouped by category and sorted by name. */
export const groceriesQueryOptions = queryOptions({
  queryKey: groceryKeys.all,
  queryFn: async () => {
    const response = await api.groceries.$get()

    if (!response.ok) {
      throw new ApiError(response.status)
    }

    return response.json()
  },
})

/**
 * Saves a grocery: creates it when there is no `id`, replaces it otherwise.
 * A duplicate name fails with an `ApiError` with status 409.
 */
export function useSaveGrocery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: GroceryInput }) => {
      const response = id
        ? await api.groceries[':id'].$put({ param: { id }, json: input })
        : await api.groceries.$post({ json: input })

      if (!response.ok) {
        throw new ApiError(response.status)
      }

      return response.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groceryKeys.all }),
  })
}

export function useDeleteGrocery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.groceries[':id'].$delete({ param: { id } })

      if (!response.ok) {
        throw new ApiError(response.status)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groceryKeys.all }),
  })
}
