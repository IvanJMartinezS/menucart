import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { ApiError, api } from '../../lib/api.ts'

/** Ingredient names already used in other menus that contain `search`, most used first. */
export const ingredientSuggestionsQueryOptions = (search: string) =>
  queryOptions({
    queryKey: ['ingredients', 'suggestions', search],
    queryFn: async () => {
      const response = await api.ingredients.suggestions.$get({ query: { q: search } })

      if (!response.ok) {
        throw new ApiError(response.status)
      }

      return response.json()
    },
    // Suggestions are only a help: nothing is asked until something is written.
    enabled: search.length > 0,
    // While the next suggestions arrive, the previous ones stay visible instead of disappearing.
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  })
