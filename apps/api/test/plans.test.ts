import { beforeEach, describe, expect, it } from 'vitest'
import type { ErrorBody } from '../src/lib/errors.ts'
import { postJson, putJson, request, resetDatabase } from './helpers.ts'

type PlanGrocery = {
  id: string
  groceryId: string | null
  name: string
  category: string
  unit: string
  quantity: number
}

type Plan = {
  id: string
  startDate: string
  endDate: string
  menus: {
    menuId: string
    times: number
    menu: { id: string; name: string; archivedAt: string | null; ingredients: { name: string }[] }
  }[]
  groceries: PlanGrocery[]
}

const november1 = { startDate: '2026-11-02', endDate: '2026-11-16' }
const november2 = { startDate: '2026-11-17', endDate: '2026-11-30' }

const createPlan = async (dates: object) => (await postJson('/plans', dates)).json<Plan>()

const getPlan = async (id: string) => (await request(`/plans/${id}`)).json<Plan>()

const createMenu = async (name: string) =>
  (
    await postJson('/menus', {
      name,
      ingredients: [{ name: 'cebolla', quantity: 1, category: 'vegetables' }],
    })
  ).json<{ id: string }>()

const createGrocery = async (name: string, frequency: string, defaultQuantity = 1) =>
  (
    await postJson('/groceries', {
      name,
      category: 'pantry',
      defaultQuantity,
      unit: 'kg',
      frequency,
    })
  ).json<{ id: string }>()

beforeEach(resetDatabase)

describe('POST /plans', () => {
  it('creates a plan with the chosen dates', async () => {
    const response = await postJson('/plans', november1)

    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({ ...november1, menus: [], groceries: [] })
  })

  it('starts with the biweekly groceries checked, with their usual quantity', async () => {
    const arroz = await createGrocery('Arroz', 'biweekly', 2)
    await createGrocery('Aceite', 'monthly')
    await createGrocery('Sal', 'occasional')

    const plan = await createPlan(november1)

    expect(plan.groceries).toEqual([
      {
        id: expect.any(String),
        groceryId: arroz.id,
        name: 'Arroz',
        category: 'pantry',
        unit: 'kg',
        quantity: 2,
      },
    ])
  })

  it('answers 409 and creates nothing when the dates overlap another plan', async () => {
    await createPlan(november1)

    const response = await postJson('/plans', { startDate: '2026-11-16', endDate: '2026-11-20' })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'conflict',
      message: 'This plan overlaps the dates of another plan',
    })
    expect(await (await request('/plans')).json()).toHaveLength(1)
  })

  it('allows a gap between two plans', async () => {
    await createPlan(november1)

    const response = await postJson('/plans', { startDate: '2026-12-05', endDate: '2026-12-20' })

    expect(response.status).toBe(201)
  })

  it('answers 400 when the plan ends before it starts', async () => {
    const response = await postJson('/plans', { startDate: '2026-11-16', endDate: '2026-11-02' })

    expect(response.status).toBe(400)
    expect((await response.json<ErrorBody>()).details?.[0]?.path).toBe('endDate')
  })
})

describe('GET /plans/current', () => {
  const current = async (today: string) =>
    (await request(`/plans/current?today=${today}`)).json<Plan | null>()

  it('answers null when there is no plan', async () => {
    expect(await current('2026-11-10')).toBeNull()
  })

  it('returns the plan that contains today', async () => {
    await createPlan(november1)
    await createPlan(november2)

    expect((await current('2026-11-20'))?.startDate).toBe('2026-11-17')
    expect((await current('2026-11-16'))?.startDate).toBe('2026-11-02')
  })

  it('returns the next plan when it was created in advance', async () => {
    await createPlan(november2)

    expect((await current('2026-11-10'))?.startDate).toBe('2026-11-17')
  })

  it('ignores plans that already ended', async () => {
    await createPlan(november1)

    expect(await current('2026-11-20')).toBeNull()
  })

  it('answers 400 without today', async () => {
    expect((await request('/plans/current')).status).toBe(400)
  })
})

describe('GET /plans/suggestion', () => {
  it('proposes the day after the last plan, lasting 15 days', async () => {
    await createPlan(november1)

    const response = await request('/plans/suggestion?today=2026-11-10')

    expect(await response.json()).toEqual({ startDate: '2026-11-17', endDate: '2026-12-01' })
  })

  it('proposes today when there is no plan', async () => {
    const response = await request('/plans/suggestion?today=2026-11-10')

    expect(await response.json()).toEqual({ startDate: '2026-11-10', endDate: '2026-11-24' })
  })
})

describe('GET /plans', () => {
  it('lists plans newest first, with how many menus and groceries they have', async () => {
    const menu = await createMenu('Pabellón')
    await createGrocery('Arroz', 'biweekly')
    const first = await createPlan(november1)
    await createPlan(november2)
    await putJson(`/plans/${first.id}/menus/${menu.id}`, { times: 2 })

    const plans = await (await request('/plans')).json<object[]>()

    expect(plans).toEqual([
      expect.objectContaining({ ...november2, menuCount: 0, groceryCount: 1 }),
      expect.objectContaining({ ...november1, menuCount: 2, groceryCount: 1 }),
    ])
  })
})

describe('PUT /plans/:id', () => {
  it('changes the dates', async () => {
    const plan = await createPlan(november1)

    const response = await putJson(`/plans/${plan.id}`, {
      startDate: '2026-11-02',
      endDate: '2026-11-18',
    })

    expect(response.status).toBe(200)
    expect((await getPlan(plan.id)).endDate).toBe('2026-11-18')
  })

  it('answers 409 when the new dates overlap another plan', async () => {
    const plan = await createPlan(november1)
    await createPlan(november2)

    const response = await putJson(`/plans/${plan.id}`, {
      startDate: '2026-11-02',
      endDate: '2026-11-20',
    })

    expect(response.status).toBe(409)
    expect((await getPlan(plan.id)).endDate).toBe('2026-11-16')
  })

  it('answers 404 when the plan does not exist', async () => {
    const response = await putJson('/plans/00000000-0000-4000-8000-000000000000', november1)

    expect(response.status).toBe(404)
  })
})

describe('DELETE /plans/:id', () => {
  it('deletes the plan but keeps its menus and groceries in the catalog', async () => {
    const menu = await createMenu('Pabellón')
    await createGrocery('Arroz', 'biweekly')
    const plan = await createPlan(november1)
    await putJson(`/plans/${plan.id}/menus/${menu.id}`, { times: 1 })

    const response = await request(`/plans/${plan.id}`, { method: 'DELETE' })

    expect(response.status).toBe(204)
    expect((await request(`/plans/${plan.id}`)).status).toBe(404)
    expect(await (await request('/menus')).json()).toHaveLength(1)
    expect(await (await request('/groceries')).json()).toHaveLength(1)
  })
})

describe('menus in a plan', () => {
  it('adds a menu, and planning it again changes how many times', async () => {
    const menu = await createMenu('Pabellón')
    const plan = await createPlan(november1)

    const added = await putJson(`/plans/${plan.id}/menus/${menu.id}`, { times: 1 })
    await putJson(`/plans/${plan.id}/menus/${menu.id}`, { times: 2 })

    expect(added.status).toBe(200)
    expect((await getPlan(plan.id)).menus).toEqual([
      {
        menuId: menu.id,
        times: 2,
        menu: {
          id: menu.id,
          name: 'Pabellón',
          archivedAt: null,
          ingredients: [expect.objectContaining({ name: 'cebolla' })],
        },
      },
    ])
  })

  it('removes a menu from the plan', async () => {
    const menu = await createMenu('Pabellón')
    const plan = await createPlan(november1)
    await putJson(`/plans/${plan.id}/menus/${menu.id}`, { times: 1 })

    const response = await request(`/plans/${plan.id}/menus/${menu.id}`, { method: 'DELETE' })

    expect(response.status).toBe(204)
    expect((await getPlan(plan.id)).menus).toEqual([])
  })

  it('answers 404 when removing a menu that is not in the plan', async () => {
    const menu = await createMenu('Pabellón')
    const plan = await createPlan(november1)

    const response = await request(`/plans/${plan.id}/menus/${menu.id}`, { method: 'DELETE' })

    expect(response.status).toBe(404)
  })

  it('answers 404 when the plan or the menu does not exist', async () => {
    const menu = await createMenu('Pabellón')
    const plan = await createPlan(november1)
    const missing = '00000000-0000-4000-8000-000000000000'

    expect((await putJson(`/plans/${missing}/menus/${menu.id}`, { times: 1 })).status).toBe(404)
    expect((await putJson(`/plans/${plan.id}/menus/${missing}`, { times: 1 })).status).toBe(404)
  })

  it('answers 400 when the menu is planned 0 times', async () => {
    const menu = await createMenu('Pabellón')
    const plan = await createPlan(november1)

    expect((await putJson(`/plans/${plan.id}/menus/${menu.id}`, { times: 0 })).status).toBe(400)
  })
})

describe('groceries in a plan', () => {
  it('checks a grocery with the quantity to buy, copying its data', async () => {
    const aceite = await createGrocery('Aceite', 'monthly')
    const plan = await createPlan(november1)

    const response = await putJson(`/plans/${plan.id}/groceries/${aceite.id}`, { quantity: 2 })

    expect(response.status).toBe(200)
    expect((await getPlan(plan.id)).groceries).toEqual([
      expect.objectContaining({ groceryId: aceite.id, name: 'Aceite', unit: 'kg', quantity: 2 }),
    ])
  })

  it('changes the quantity of a grocery already checked', async () => {
    const arroz = await createGrocery('Arroz', 'biweekly', 2)
    const plan = await createPlan(november1)

    await putJson(`/plans/${plan.id}/groceries/${arroz.id}`, { quantity: 3 })

    const { groceries } = await getPlan(plan.id)
    expect(groceries.map(({ name, quantity }) => [name, quantity])).toEqual([['Arroz', 3]])
  })

  it('unchecks a grocery', async () => {
    const arroz = await createGrocery('Arroz', 'biweekly')
    const plan = await createPlan(november1)

    const response = await request(`/plans/${plan.id}/groceries/${arroz.id}`, {
      method: 'DELETE',
    })

    expect(response.status).toBe(204)
    expect((await getPlan(plan.id)).groceries).toEqual([])
  })

  it('keeps its quantity when the grocery changes in the catalog', async () => {
    const arroz = await createGrocery('Arroz', 'biweekly', 2)
    const plan = await createPlan(november1)

    await putJson(`/groceries/${arroz.id}`, {
      name: 'Arroz',
      category: 'pantry',
      defaultQuantity: 5,
      unit: 'kg',
      frequency: 'biweekly',
    })

    expect((await getPlan(plan.id)).groceries[0]?.quantity).toBe(2)
  })

  it('keeps its copy when the grocery is deleted from the catalog', async () => {
    const arroz = await createGrocery('Arroz', 'biweekly', 2)
    const plan = await createPlan(november1)

    await request(`/groceries/${arroz.id}`, { method: 'DELETE' })

    expect((await getPlan(plan.id)).groceries).toEqual([
      expect.objectContaining({ groceryId: null, name: 'Arroz', quantity: 2 }),
    ])
  })
})

describe('deleting a menu used in a plan', () => {
  it('archives it: it leaves the catalog, but the plan keeps it', async () => {
    const menu = await createMenu('Pabellón')
    const plan = await createPlan(november1)
    await putJson(`/plans/${plan.id}/menus/${menu.id}`, { times: 1 })

    const response = await request(`/menus/${menu.id}`, { method: 'DELETE' })

    expect(response.status).toBe(204)
    expect(await (await request('/menus')).json()).toEqual([])
    const [planned] = (await getPlan(plan.id)).menus
    expect(planned?.menu).toMatchObject({ name: 'Pabellón', archivedAt: expect.any(String) })
  })

  it('cannot be planned again once archived', async () => {
    const menu = await createMenu('Pabellón')
    const used = await createPlan(november1)
    await putJson(`/plans/${used.id}/menus/${menu.id}`, { times: 1 })
    await request(`/menus/${menu.id}`, { method: 'DELETE' })
    const next = await createPlan(november2)

    const response = await putJson(`/plans/${next.id}/menus/${menu.id}`, { times: 1 })

    expect(response.status).toBe(404)
  })

  it('still deletes for good a menu never used in a plan', async () => {
    const menu = await createMenu('Pabellón')

    await request(`/menus/${menu.id}`, { method: 'DELETE' })

    expect((await request(`/menus/${menu.id}`)).status).toBe(404)
  })
})
