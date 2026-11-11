import { queryOptions } from '@tanstack/react-query'
import type { InferResponseType } from 'hono/client'
import { ApiError, api } from '../../lib/api.ts'

/** A menu as the API returns it, with its ingredients. The type comes from the API code. */
export type Menu = InferResponseType<typeof api.menus.$get, 200>[number]

/** Every menu, newest first. */
export const menusQueryOptions = queryOptions({
  queryKey: ['menus'],
  queryFn: async () => {
    const response = await api.menus.$get()

    if (!response.ok) {
      throw new ApiError(response.status)
    }

    return response.json()
  },
})
