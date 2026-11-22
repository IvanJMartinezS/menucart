import { beforeEach, describe, expect, it } from 'vitest'
import { postJson, putJson, request, resetDatabaseAndSignIn } from './helpers.ts'

type ShoppingList = {
  planId: string
  startDate: string
  endDate: string
  sections: {
    category: string
    items: { name: string; quantity: number; unit: string | null; usedIn: string[] }[]
  }[]
}

const createMenu = async (name: string, ingredients: [string, number, string][]) =>
  (
    await postJson('/menus', {
      name,
      ingredients: ingredients.map(([ingredient, quantity, category]) => ({
        name: ingredient,
        quantity,
        category,
      })),
    })
  ).json<{ id: string }>()

const createGrocery = async (
  name: string,
  category: string,
  quantity: number,
  unit: string,
  frequency: string,
) =>
  (
    await postJson('/groceries', { name, category, defaultQuantity: quantity, unit, frequency })
  ).json<{ id: string }>()

const createPlan = async () =>
  (await postJson('/plans', { startDate: '2026-11-17', endDate: '2026-11-30' })).json<{
    id: string
  }>()

const shoppingList = async (planId: string) =>
  (await request(`/plans/${planId}/shopping-list`)).json<ShoppingList>()

beforeEach(resetDatabaseAndSignIn)

describe('GET /plans/:id/shopping-list', () => {
  it('builds the list of a real plan from the database', async () => {
    const bistec = await createMenu('Bistec con ensalada y maduro', [
      ['bistec', 4, 'meat'],
      ['maduro', 2, 'vegetables'],
      ['cebolla', 1, 'vegetables'],
    ])
    const pabellon = await createMenu('Pabellón criollo', [
      ['carne para mechar', 1, 'meat'],
      ['Cebolla', 1, 'vegetables'],
    ])
    await createGrocery('Arroz', 'pantry', 2, 'kg', 'biweekly')
    await createGrocery('Jamón', 'deli', 500, 'g', 'biweekly')
    await createGrocery('Aceite', 'pantry', 1, 'l', 'monthly')
    const plan = await createPlan()
    await putJson(`/plans/${plan.id}/menus/${bistec.id}`, { times: 2 })
    await putJson(`/plans/${plan.id}/menus/${pabellon.id}`, { times: 1 })

    const response = await request(`/plans/${plan.id}/shopping-list`)
    const list = await response.json<ShoppingList>()

    expect(response.status).toBe(200)
    expect(list).toMatchObject({ planId: plan.id, startDate: '2026-11-17', endDate: '2026-11-30' })
    expect(list.sections).toEqual([
      {
        category: 'vegetables',
        items: [
          {
            name: 'cebolla',
            quantity: 3,
            unit: null,
            usedIn: ['Bistec con ensalada y maduro', 'Pabellón criollo'],
          },
          { name: 'maduro', quantity: 4, unit: null, usedIn: ['Bistec con ensalada y maduro'] },
        ],
      },
      {
        category: 'meat',
        items: [
          { name: 'bistec', quantity: 8, unit: null, usedIn: ['Bistec con ensalada y maduro'] },
          { name: 'carne para mechar', quantity: 1, unit: null, usedIn: ['Pabellón criollo'] },
        ],
      },
      { category: 'deli', items: [{ name: 'Jamón', quantity: 500, unit: 'g', usedIn: [] }] },
      // Aceite is monthly, so it is not checked in the new plan.
      { category: 'pantry', items: [{ name: 'Arroz', quantity: 2, unit: 'kg', usedIn: [] }] },
    ])
  })

  it('follows the changes of the plan', async () => {
    const pollo = await createMenu('Pollo', [['pollo', 1, 'meat']])
    const aceite = await createGrocery('Aceite', 'pantry', 1, 'l', 'monthly')
    const plan = await createPlan()

    expect((await shoppingList(plan.id)).sections).toEqual([])

    await putJson(`/plans/${plan.id}/menus/${pollo.id}`, { times: 3 })
    await putJson(`/plans/${plan.id}/groceries/${aceite.id}`, { quantity: 2 })

    const lines = (await shoppingList(plan.id)).sections.flatMap(({ items }) =>
      items.map(({ name, quantity }) => `${name} ${quantity}`),
    )
    expect(lines).toEqual(['pollo 3', 'Aceite 2'])
  })

  it('keeps the ingredients of a menu archived after it was planned', async () => {
    const sopa = await createMenu('Sopa de res', [['costilla', 1, 'meat']])
    const plan = await createPlan()
    await putJson(`/plans/${plan.id}/menus/${sopa.id}`, { times: 1 })

    await request(`/menus/${sopa.id}`, { method: 'DELETE' })

    expect((await shoppingList(plan.id)).sections[0]?.items[0]?.name).toBe('costilla')
  })

  it('answers 404 when the plan does not exist', async () => {
    const response = await request('/plans/00000000-0000-4000-8000-000000000000/shopping-list')

    expect(response.status).toBe(404)
  })
})
