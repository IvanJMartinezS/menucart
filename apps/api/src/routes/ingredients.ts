import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { menuIngredients } from '../db/schema.ts'
import type { AppEnv } from '../env.ts'
import { validateQuery } from '../lib/validation.ts'

const suggestionsQuerySchema = z.object({
  q: z.string().trim().min(1).max(50),
  limit: z.coerce.number().int().min(1).max(20).default(10),
})

/** Escapes the characters that have a special meaning in a SQL `LIKE` pattern. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (char) => `\\${char}`)

/** Compares names ignoring case, accents and surrounding spaces: "Pimentón " = "pimenton". */
const normalized = (value: unknown) => sql`lower(unaccent(trim(${value})))`

export const ingredientsRoutes = new Hono<AppEnv>()
  /**
   * Suggests ingredient names already used in any menu, for the autocomplete of the menu form.
   * Each suggestion includes the category most used for that name, so the form can fill it in.
   * Names that start with the search come first, then the most used ones.
   */
  .get('/suggestions', validateQuery(suggestionsQuerySchema), async (c) => {
    const { q, limit } = c.req.valid('query')
    const search = escapeLike(q)
    const name = normalized(menuIngredients.name)

    const suggestions = await c.var.db
      .select({
        name: sql<string>`mode() within group (order by ${menuIngredients.name})`,
        category: sql<string>`mode() within group (order by ${menuIngredients.category})`,
        uses: sql<number>`count(*)::int`,
      })
      .from(menuIngredients)
      .where(sql`${name} like '%' || ${normalized(search)} || '%'`)
      .groupBy(name)
      .orderBy(sql`${name} like ${normalized(search)} || '%' desc`, sql`count(*) desc`, name)
      .limit(limit)

    return c.json(suggestions)
  })
