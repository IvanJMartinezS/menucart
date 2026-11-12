import type { MenuInput } from '@menucart/shared'
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InferResponseType } from 'hono/client'
import { ApiError, api } from '../../lib/api.ts'

/** A menu as the API returns it, with its ingredients. The type comes from the API code. */
export type Menu = InferResponseType<typeof api.menus.$get, 200>[number]

export const menuKeys = {
  all: ['menus'] as const,
  detail: (id: string) => ['menus', id] as const,
}

/** Every menu, newest first. */
export const menusQueryOptions = queryOptions({
  queryKey: menuKeys.all,
  queryFn: async () => {
    const response = await api.menus.$get()

    if (!response.ok) {
      throw new ApiError(response.status)
    }

    return response.json()
  },
})

/** One menu with its ingredients. A missing menu fails with an `ApiError` with status 404. */
export const menuQueryOptions = (id: string) =>
  queryOptions({
    queryKey: menuKeys.detail(id),
    queryFn: async () => {
      const response = await api.menus[':id'].$get({ param: { id } })

      if (!response.ok) {
        throw new ApiError(response.status)
      }

      return response.json()
    },
    // A menu that does not exist will not appear by trying again.
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 1,
  })

/**
 * Saves a menu: creates it when there is no `id`, replaces it otherwise.
 * Afterwards, the cached menus are marked as outdated so every screen shows the change.
 */
export function useSaveMenu(id?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: MenuInput) => {
      const response = id
        ? await api.menus[':id'].$put({ param: { id }, json: input })
        : await api.menus.$post({ json: input })

      if (!response.ok) {
        throw new ApiError(response.status)
      }

      return response.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: menuKeys.all }),
  })
}
