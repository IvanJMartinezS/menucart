import { queryOptions, useMutation } from '@tanstack/react-query'
import type { InferResponseType } from 'hono/client'
import { ApiError, api } from '../../lib/api.ts'

/** The household of the signed-in user and the people who share it. */
export type Household = InferResponseType<typeof api.households.current.$get, 200>

/** A code to join the household, as the API returns it once. */
export type Invitation = InferResponseType<typeof api.households.invitations.$post, 201>

export const householdQueryOptions = queryOptions({
  queryKey: ['household'],
  queryFn: async () => {
    const response = await api.households.current.$get()

    if (!response.ok) {
      throw ApiError.from(response)
    }

    return response.json()
  },
})

/** Creates a code to join the household. A new code cancels the previous unused one. */
export function useCreateInvitation() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.households.invitations.$post()

      if (!response.ok) {
        throw ApiError.from(response)
      }

      return response.json()
    },
  })
}
