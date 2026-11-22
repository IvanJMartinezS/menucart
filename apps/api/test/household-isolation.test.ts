import { beforeEach, describe, expect, it } from 'vitest'
import app from '../src/index.ts'
import {
  createTestAccount,
  postJson,
  putJson,
  request,
  resetDatabase,
  resetDatabaseAndSignIn,
  sessionHeaders,
} from './helpers.ts'

type Identified = { id: string }
type Plan = Identified & {
  startDate: string
  endDate: string
  menus: { menuId: string; times: number }[]
  groceries: { groceryId: string | null; name: string }[]
}

const bistec = {
  name: 'Bistec con ensalada',
  ingredients: [{ name: 'bistec', quantity: 1, category: 'meat' }],
}
const harina = {
  name: 'Harina de maíz',
  category: 'pantry',
  defaultQuantity: 2,
  unit: 'package',
  frequency: 'biweekly',
}
const december = { startDate: '2026-12-01', endDate: '2026-12-15' }
const today = '2026-12-05'

/** A valid id that does not belong to anything. */
const missingId = '00000000-0000-4000-8000-000000000000'

/** The data of Ana's household: one menu and one grocery, both chosen in a plan. */
let ana: { menuId: string; groceryId: string; planId: string }

/** Requests sent with the session of Luis, who lives in another household. */
let asLuis: RequestInit

/** Signs in as Ana, with her data, and creates Luis in another household. */
async function setUpTwoHouseholds() {
  // Signs in as Ana: requests without their own session are hers.
  await resetDatabaseAndSignIn()

  const menu = await (await postJson('/menus', bistec)).json<Identified>()
  const grocery = await (await postJson('/groceries', harina)).json<Identified>()
  const plan = await (await postJson('/plans', december)).json<Identified>()
  await putJson(`/plans/${plan.id}/menus/${menu.id}`, { times: 2 })
  ana = { menuId: menu.id, groceryId: grocery.id, planId: plan.id }

  asLuis = { headers: sessionHeaders((await createTestAccount('Luis')).token) }
}

const statusOf = async (response: Response | Promise<Response>) => (await response).status

const deleteAs = (path: string, init: RequestInit) => request(path, { ...init, method: 'DELETE' })

const anaPlan = async () => (await request(`/plans/${ana.planId}`)).json<Plan>()

describe('Menus of another household', () => {
  beforeEach(setUpTwoHouseholds)

  it('are not listed', async () => {
    expect(await (await request('/menus', asLuis)).json()).toEqual([])
  })

  it('cannot be read, changed or deleted', async () => {
    const path = `/menus/${ana.menuId}`

    expect(await statusOf(request(path, asLuis))).toBe(404)
    expect(await statusOf(putJson(path, { ...bistec, name: 'Cambiado' }, asLuis))).toBe(404)
    expect(await statusOf(deleteAs(path, asLuis))).toBe(404)

    const menu = await (await request(path)).json<{ name: string }>()
    expect(menu.name).toBe(bistec.name)
  })

  it('do not show up in the ingredient suggestions', async () => {
    const suggestions = await request('/ingredients/suggestions?q=bis', asLuis)

    expect(await suggestions.json()).toEqual([])
    expect(await (await request('/ingredients/suggestions?q=bis')).json()).toHaveLength(1)
  })
})

describe('Groceries of another household', () => {
  beforeEach(setUpTwoHouseholds)

  it('are not listed', async () => {
    expect(await (await request('/groceries', asLuis)).json()).toEqual([])
  })

  it('cannot be read, changed or deleted', async () => {
    const path = `/groceries/${ana.groceryId}`

    expect(await statusOf(request(path, asLuis))).toBe(404)
    expect(await statusOf(putJson(path, { ...harina, name: 'Cambiado' }, asLuis))).toBe(404)
    expect(await statusOf(deleteAs(path, asLuis))).toBe(404)

    const grocery = await (await request(path)).json<{ name: string }>()
    expect(grocery.name).toBe(harina.name)
  })

  it('can have the same name, which is unique only within each household', async () => {
    expect(await statusOf(postJson('/groceries', harina, asLuis))).toBe(201)
    expect(await statusOf(postJson('/groceries', harina, asLuis))).toBe(409)
  })
})

describe('Plans of another household', () => {
  beforeEach(setUpTwoHouseholds)

  it('are not listed, nor taken as the current plan or for the suggestion', async () => {
    expect(await (await request('/plans', asLuis)).json()).toEqual([])
    expect(await (await request(`/plans/current?today=${today}`, asLuis)).json()).toBeNull()
    expect(await (await request(`/plans/suggestion?today=${today}`, asLuis)).json()).toEqual({
      startDate: today,
      endDate: '2026-12-19',
    })
  })

  it('cannot be read, changed or deleted', async () => {
    const path = `/plans/${ana.planId}`

    expect(await statusOf(request(path, asLuis))).toBe(404)
    expect(await statusOf(request(`${path}/shopping-list`, asLuis))).toBe(404)
    expect(await statusOf(putJson(path, { ...december, endDate: '2026-12-10' }, asLuis))).toBe(404)
    expect(await statusOf(deleteAs(path, asLuis))).toBe(404)

    expect((await anaPlan()).endDate).toBe(december.endDate)
  })

  it('cannot get menus or groceries added or removed', async () => {
    const menuPath = `/plans/${ana.planId}/menus/${ana.menuId}`
    const groceryPath = `/plans/${ana.planId}/groceries/${ana.groceryId}`

    expect(await statusOf(putJson(menuPath, { times: 5 }, asLuis))).toBe(404)
    expect(await statusOf(deleteAs(menuPath, asLuis))).toBe(404)
    expect(await statusOf(putJson(groceryPath, { quantity: 9 }, asLuis))).toBe(404)
    expect(await statusOf(deleteAs(groceryPath, asLuis))).toBe(404)

    const plan = await anaPlan()
    expect(plan.menus).toEqual([{ menuId: ana.menuId, times: 2, menu: expect.any(Object) }])
    expect(plan.groceries).toHaveLength(1)
  })

  it('do not block the same dates in another household', async () => {
    expect(await statusOf(postJson('/plans', december, asLuis))).toBe(201)
    expect(await statusOf(postJson('/plans', december, asLuis))).toBe(409)
  })
})

describe('A plan of one household', () => {
  beforeEach(setUpTwoHouseholds)

  let luisPlanId: string

  beforeEach(async () => {
    luisPlanId = (await (await postJson('/plans', december, asLuis)).json<Plan>()).id
  })

  it('does not take the biweekly groceries of another household', async () => {
    const plan = await (await request(`/plans/${luisPlanId}`, asLuis)).json<Plan>()

    expect(plan.groceries).toEqual([])
  })

  it('cannot get menus or groceries of another household', async () => {
    const menuPath = `/plans/${luisPlanId}/menus/${ana.menuId}`
    const groceryPath = `/plans/${luisPlanId}/groceries/${ana.groceryId}`

    expect(await statusOf(putJson(menuPath, { times: 1 }, asLuis))).toBe(404)
    expect(await statusOf(putJson(groceryPath, { quantity: 1 }, asLuis))).toBe(404)

    const plan = await (await request(`/plans/${luisPlanId}`, asLuis)).json<Plan>()
    expect(plan.menus).toEqual([])
    expect(plan.groceries).toEqual([])
  })
})

describe('Endpoints of household data', () => {
  beforeEach(resetDatabase)

  /** Every route of the API, with its parameters filled in, except the public ones. */
  const routes = app.routes
    .filter(({ method }) => method !== 'ALL')
    .filter(({ path }) => path !== '/health' && !path.startsWith('/auth/'))
    .map(({ method, path }) => `${method} ${path.replace(/:\w+/g, missingId)}`)

  // Hono lists a route once per handler (validators included), so repeated ones are removed.
  const protectedRoutes = [...new Set(routes)].map((route) => {
    const [method, path] = route.split(' ')
    return { method: method!, path: path! }
  })

  it('include every data resource', () => {
    const resources = new Set(protectedRoutes.map(({ path }) => path.split('/')[1]))

    expect(resources).toEqual(new Set(['households', 'menus', 'ingredients', 'groceries', 'plans']))
  })

  it.each(protectedRoutes)('$method $path needs a session', async ({ method, path }) => {
    const response = await request(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : '{}',
    })

    expect(response.status).toBe(401)
  })
})
