import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { todayIso } from '../lib/dates.ts'
import { mockApi } from '../test/mock-api.ts'
import { renderAt } from '../test/render.tsx'

const ingredient = { id: 'i', name: 'cebolla', quantity: 1, category: 'vegetables', position: 0 }
const menu = (id: string, name: string, archivedAt: string | null = null) => ({
  id,
  name,
  notes: null,
  archivedAt,
  createdAt: '2026-11-10T12:00:00.000Z',
  updatedAt: '2026-11-10T12:00:00.000Z',
  ingredients: [ingredient],
})
const grocery = (id: string, name: string, frequency: string, defaultQuantity: number) => ({
  id,
  name,
  category: 'pantry',
  defaultQuantity,
  unit: 'kg',
  frequency,
  createdAt: '2026-11-10T12:00:00.000Z',
  updatedAt: '2026-11-10T12:00:00.000Z',
})

const bistec = menu('m1', 'Bistec con ensalada')
const pabellon = menu('m2', 'Pabellón criollo')
const arroz = grocery('g1', 'Arroz', 'biweekly', 2)
const aceite = grocery('g2', 'Aceite', 'monthly', 1)

type PlanState = {
  id: string
  startDate: string
  endDate: string
  createdAt: string
  menus: { menuId: string; times: number; menu: unknown }[]
  groceries: {
    id: string
    groceryId: string
    name: string
    category: string
    unit: string
    quantity: number
  }[]
}

/** A fake API with memory: it changes its plan like the real one, so screens can be checked after each change. */
function fakeApi({ plan, failWrites = false }: { plan: PlanState | null; failWrites?: boolean }) {
  const state = { plan, failed: false }
  const fail = () => {
    state.failed = true
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
  const requests = mockApi([
    {
      method: 'GET',
      path: '/plans/current',
      // After a failed write the server stays silent, so only the undo can restore the screen.
      respond: () => (state.failed ? new Promise<Response>(() => {}) : Response.json(state.plan)),
    },
    {
      method: 'GET',
      path: '/plans/suggestion',
      respond: () => Response.json({ startDate: '2026-11-17', endDate: '2026-12-01' }),
    },
    { method: 'GET', path: '/menus', respond: () => Response.json([bistec, pabellon]) },
    { method: 'GET', path: '/groceries', respond: () => Response.json([aceite, arroz]) },
    {
      method: 'POST',
      path: '/plans',
      respond: ({ body }) => {
        state.plan = {
          id: 'p1',
          createdAt: '2026-11-17T12:00:00.000Z',
          ...(body as { startDate: string; endDate: string }),
          menus: [],
          groceries: [
            {
              id: 'pg1',
              groceryId: 'g1',
              name: 'Arroz',
              category: 'pantry',
              unit: 'kg',
              quantity: 2,
            },
          ],
        }
        return Response.json(state.plan, { status: 201 })
      },
    },
    {
      method: 'PUT',
      path: '/plans/:id/menus/:menuId',
      respond: ({ path, body }) => {
        if (failWrites) return fail()
        const menuId = path.split('/').at(-1)!
        const { times } = body as { times: number }
        const others = state.plan!.menus.filter((planned) => planned.menuId !== menuId)
        const found = [bistec, pabellon].find(({ id }) => id === menuId)
        state.plan!.menus = [...others, { menuId, times, menu: found }]
        return Response.json({ menuId, times })
      },
    },
    {
      method: 'DELETE',
      path: '/plans/:id/menus/:menuId',
      respond: ({ path }) => {
        const menuId = path.split('/').at(-1)
        state.plan!.menus = state.plan!.menus.filter((planned) => planned.menuId !== menuId)
        return new Response(null, { status: 204 })
      },
    },
    {
      method: 'PUT',
      path: '/plans/:id/groceries/:groceryId',
      respond: ({ path, body }) => {
        if (failWrites) return fail()
        const groceryId = path.split('/').at(-1)!
        const { quantity } = body as { quantity: number }
        const found = [arroz, aceite].find(({ id }) => id === groceryId)!
        const others = state.plan!.groceries.filter((checked) => checked.groceryId !== groceryId)
        state.plan!.groceries = [
          ...others,
          {
            id: `pg-${groceryId}`,
            groceryId,
            name: found.name,
            category: 'pantry',
            unit: 'kg',
            quantity,
          },
        ]
        return Response.json({})
      },
    },
    {
      method: 'DELETE',
      path: '/plans/:id/groceries/:groceryId',
      respond: ({ path }) => {
        const groceryId = path.split('/').at(-1)
        state.plan!.groceries = state.plan!.groceries.filter(
          (checked) => checked.groceryId !== groceryId,
        )
        return new Response(null, { status: 204 })
      },
    },
  ])
  return requests
}

const emptyPlan = (): PlanState => ({
  id: 'p1',
  startDate: '2026-11-17',
  endDate: '2026-12-01',
  createdAt: '2026-11-17T12:00:00.000Z',
  menus: [],
  groceries: [
    { id: 'pg1', groceryId: 'g1', name: 'Arroz', category: 'pantry', unit: 'kg', quantity: 2 },
  ],
})

const card = (name: string) => within(screen.getByRole('article', { name }))
const cart = () => screen.getByRole('status')
const writes = <T extends { method: string }>(requests: T[]) =>
  requests.filter(({ method }) => method === 'PUT' || method === 'DELETE')

describe('without a plan', () => {
  it('proposes the dates and starts the plan', async () => {
    const requests = fakeApi({ plan: null })
    renderAt('/plan')

    expect(await screen.findByLabelText('Desde')).toHaveValue('2026-11-17')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-12-01')
    expect(screen.getByText('15 días')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Empezar quincena' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: /17 nov.*1 dic/ }),
    ).toBeInTheDocument()
    expect(requests.find(({ method }) => method === 'POST')?.body).toEqual({
      startDate: '2026-11-17',
      endDate: '2026-12-01',
    })
  })

  it('asks the API for the plan of the user’s today', async () => {
    const requests = fakeApi({ plan: null })
    renderAt('/plan')

    await screen.findByLabelText('Desde')

    expect(requests.find(({ path }) => path === '/plans/current')?.query.get('today')).toBe(
      todayIso(),
    )
  })

  it('explains overlapping dates on the end date', async () => {
    fakeApi({ plan: null })
    mockApiOverride()
    renderAt('/plan')

    await userEvent.click(await screen.findByRole('button', { name: 'Empezar quincena' }))

    expect(
      await screen.findByText('Estas fechas se cruzan con otra quincena. Elige otras.'),
    ).toBeInTheDocument()
  })

  it('does not send a plan that ends before it starts', async () => {
    const requests = fakeApi({ plan: null })
    renderAt('/plan')

    const end = await screen.findByLabelText('Hasta')
    await userEvent.clear(end)
    await userEvent.type(end, '2026-11-10')
    await userEvent.click(screen.getByRole('button', { name: 'Empezar quincena' }))

    expect(
      await screen.findByText('La fecha final no puede ser anterior a la inicial.'),
    ).toBeInTheDocument()
    expect(requests.filter(({ method }) => method === 'POST')).toHaveLength(0)
  })
})

/** Makes the next plan creation answer 409, keeping every other route of the fake API. */
function mockApiOverride() {
  const fakeFetch = vi.mocked(fetch).getMockImplementation()!
  vi.mocked(fetch).mockImplementation(async (input, init) =>
    init?.method === 'POST'
      ? Response.json({ error: 'conflict' }, { status: 409 })
      : fakeFetch(input, init),
  )
}

describe('choosing menus', () => {
  it('shows the period and every menu of the catalog', async () => {
    fakeApi({ plan: emptyPlan() })
    renderAt('/plan')

    expect(
      await screen.findByRole('heading', { level: 1, name: /17 nov.*1 dic/ }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('article', { name: 'Bistec con ensalada' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Pabellón criollo' })).toBeInTheDocument()
  })

  it('adds a menu, plans it again and takes it out, updating the cart', async () => {
    const requests = fakeApi({ plan: emptyPlan() })
    renderAt('/plan')
    await screen.findByRole('article', { name: 'Bistec con ensalada' })

    await userEvent.click(
      screen.getByRole('button', { name: 'Agregar Bistec con ensalada a la quincena' }),
    )
    expect(await card('Bistec con ensalada').findByText('×1')).toBeInTheDocument()

    await userEvent.click(
      card('Bistec con ensalada').getByRole('button', { name: 'Una vez más Bistec con ensalada' }),
    )
    expect(await card('Bistec con ensalada').findByText('×2')).toBeInTheDocument()
    await waitFor(() => expect(cart()).toHaveTextContent('2 menús · 1 víver'))

    await userEvent.click(
      card('Bistec con ensalada').getByRole('button', {
        name: 'Una vez menos Bistec con ensalada',
      }),
    )
    await userEvent.click(
      card('Bistec con ensalada').getByRole('button', {
        name: 'Una vez menos Bistec con ensalada',
      }),
    )
    expect(
      await card('Bistec con ensalada').findByRole('button', {
        name: 'Agregar Bistec con ensalada a la quincena',
      }),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(writes(requests).map(({ method, body }) => [method, body])).toEqual([
        ['PUT', { times: 1 }],
        ['PUT', { times: 2 }],
        ['PUT', { times: 1 }],
        ['DELETE', undefined],
      ]),
    )
    await waitFor(() => expect(cart()).toHaveTextContent('0 menús · 1 víver'))
  })

  it('shows only the chosen menus when asked', async () => {
    const plan = emptyPlan()
    plan.menus = [{ menuId: 'm2', times: 1, menu: pabellon }]
    fakeApi({ plan })
    renderAt('/plan')
    await screen.findByRole('article', { name: 'Bistec con ensalada' })

    await userEvent.click(screen.getByRole('button', { name: 'Elegidos (1)' }))

    expect(
      screen.getAllByRole('article').map((article) => article.getAttribute('aria-label')),
    ).toEqual(['Pabellón criollo'])
  })

  it('keeps an archived menu in the plan, marked as no longer in the catalog', async () => {
    const plan = emptyPlan()
    plan.menus = [
      { menuId: 'm9', times: 1, menu: menu('m9', 'Sopa de res', '2026-11-12T12:00:00.000Z') },
    ]
    fakeApi({ plan })
    renderAt('/plan')

    await screen.findByRole('article', { name: 'Sopa de res' })

    expect(card('Sopa de res').getByText('Ya no está en tu catálogo')).toBeInTheDocument()
  })

  it('goes back and explains the problem when saving fails', async () => {
    fakeApi({ plan: emptyPlan(), failWrites: true })
    renderAt('/plan')
    await screen.findByRole('article', { name: 'Bistec con ensalada' })

    await userEvent.click(
      screen.getByRole('button', { name: 'Agregar Bistec con ensalada a la quincena' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos guardar el último cambio.',
    )
    expect(
      card('Bistec con ensalada').getByRole('button', {
        name: 'Agregar Bistec con ensalada a la quincena',
      }),
    ).toBeInTheDocument()
  })
})

describe('choosing groceries', () => {
  it('starts with the plan groceries checked and the others unchecked', async () => {
    fakeApi({ plan: emptyPlan() })
    renderAt('/plan')

    expect(await screen.findByRole('checkbox', { name: 'Comprar Arroz' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Comprar Aceite' })).not.toBeChecked()
    expect(screen.getByLabelText('Cantidad de Arroz')).toHaveValue(2)
    expect(screen.getByLabelText('Cantidad de Aceite')).toBeDisabled()
  })

  it('checks a grocery with its usual quantity and unchecks it', async () => {
    const requests = fakeApi({ plan: emptyPlan() })
    renderAt('/plan')

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Comprar Aceite' }))
    await waitFor(() => expect(cart()).toHaveTextContent('0 menús · 2 víveres'))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Comprar Arroz' }))
    await waitFor(() => expect(cart()).toHaveTextContent('0 menús · 1 víver'))

    expect(
      writes(requests).map(({ method, path, body }) => [method, path.split('/').at(-1), body]),
    ).toEqual([
      ['PUT', 'g2', { quantity: 1 }],
      ['DELETE', 'g1', undefined],
    ])
  })

  it('saves a new quantity when leaving the field, and ignores an invalid one', async () => {
    const requests = fakeApi({ plan: emptyPlan() })
    renderAt('/plan')

    const quantity = await screen.findByLabelText('Cantidad de Arroz')
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '0')
    await userEvent.tab()
    expect(quantity).toHaveValue(2)
    expect(writes(requests)).toHaveLength(0)

    await userEvent.clear(quantity)
    await userEvent.type(quantity, '3.5{Enter}')

    await waitFor(() =>
      expect(writes(requests).map(({ body }) => body)).toEqual([{ quantity: 3.5 }]),
    )
    expect(quantity).toHaveValue(3.5)
  })
})
