import type { loginInputSchema, registerInputSchema } from '@menucart/shared'
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InferResponseType } from 'hono/client'
import type { z } from 'zod'
import { ApiError, api } from '../../lib/api.ts'

/** The signed-in user and their household, as the API returns them. */
export type Account = InferResponseType<typeof api.auth.me.$get, 200>

/** What the forms send, before the shared schemas clean it (spaces, capital letters). */
export type LoginFormInput = z.input<typeof loginInputSchema>
export type RegisterFormInput = z.input<typeof registerInputSchema>

export const accountQueryKey = ['account'] as const

/**
 * Who is signed in on this device, or `null` when nobody is. The session is in a cookie that
 * scripts cannot read, so the only way to know is asking the API.
 */
export const accountQueryOptions = queryOptions({
  queryKey: accountQueryKey,
  queryFn: async (): Promise<Account | null> => {
    const response = await api.auth.me.$get()
    // The 401 comes from the session middleware, so the typed client does not list it.
    const status: number = response.status

    if (status === 401) {
      return null
    }
    if (!response.ok) {
      throw ApiError.from(response)
    }

    return response.json()
  },
  // It only changes when signing in or out, which update it directly.
  staleTime: Number.POSITIVE_INFINITY,
})

/** Signs in. Fails with an `ApiError`: 401 for wrong credentials, 429 after too many attempts. */
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: LoginFormInput) => {
      const response = await api.auth.login.$post({ json: input })

      if (!response.ok) {
        throw ApiError.from(response)
      }

      return response.json()
    },
    onSuccess: (account) => queryClient.setQueryData(accountQueryKey, account),
  })
}

/**
 * Creates an account and signs in. Fails with an `ApiError`: 409 when the email already has an
 * account, 400 for an invitation code that does not work, 429 after too many attempts.
 */
export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RegisterFormInput) => {
      const response = await api.auth.register.$post({ json: input })

      if (!response.ok) {
        throw ApiError.from(response)
      }

      return response.json()
    },
    onSuccess: (account) => queryClient.setQueryData(accountQueryKey, account),
  })
}

/**
 * Signs out this device. Every cached piece of data is forgotten, so whoever uses the browser
 * next sees nothing of the household.
 */
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.auth.logout.$post()

      if (!response.ok) {
        throw ApiError.from(response)
      }
    },
    onSuccess: () => {
      queryClient.clear()
      queryClient.setQueryData(accountQueryKey, null)
    },
  })
}
