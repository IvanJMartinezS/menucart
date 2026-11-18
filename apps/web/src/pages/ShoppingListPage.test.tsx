import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockApi } from '../test/mock-api.ts'
import { renderAt } from '../test/render.tsx'

const plan = (id: string) => ({
  id,
  startDate: '2026-11-17',
  endDate: '2026-11-30',
  createdAt: '2026-11-17T12:00:00.000Z',
  menus: [],
  groceries: [],
})

const sections = [
  {
    category: 'vegetables',
    items: [
      { name: 'cebolla', quantity: 3, unit: null, usedIn: ['Bistec', 'Pabellón'] },
      { name: 'tomate', quantity: 1.5, unit: null, usedIn: ['Bistec'] },
    ],
  },
  { category: 'meat', items: [{ name: 'bistec', quantity: 8, unit: null, usedIn: ['Bistec'] }] },
  { category: 'pantry', items: [{ name: 'Arroz', quantity: 2, unit: 'kg', usedIn: [] }] },
]

/** The API with a current plan and its list, or with no plan at all. */
function fakeApi({
  planId = 'p1',
  list = sections,
}: { planId?: string | null; list?: unknown[] } = {}) {
  return mockApi([
    {
      method: 'GET',
      path: '/plans/current',
      respond: () => Response.json(planId ? plan(planId) : null),
    },
    {
      method: 'GET',
      path: '/plans/:id/shopping-list',
      respond: () =>
        Response.json({ planId, startDate: '2026-11-17', endDate: '2026-11-30', sections: list }),
    },
  ])
}

const section = (name: string) => within(screen.getByRole('region', { name }))
const checkbox = (name: string) => screen.getByRole('checkbox', { name: `Ya tengo ${name}` })

describe('shopping list', () => {
  it('shows the sections in market order, with quantities and the menus that use each product', async () => {
    fakeApi()
    renderAt('/shopping-list')

    await screen.findByRole('region', { name: 'Verduras' })

    expect(
      screen.getAllByRole('heading', { level: 2 }).map(({ textContent }) => textContent),
    ).toEqual(['Verduras', 'Carnes', 'Víveres'])
    expect(section('Verduras').getAllByRole('listitem')[0]).toHaveTextContent(
      /cebolla.*Para Bistec, Pabellón.*3/,
    )
    expect(section('Verduras').getAllByRole('listitem')[1]).toHaveTextContent(/tomate.*1,5/)
    expect(section('Víveres').getByRole('listitem')).toHaveTextContent(/Arroz.*2 kg/)
  })

  it('checks products and counts them', async () => {
    fakeApi()
    renderAt('/shopping-list')
    await screen.findByText('0 de 4 en el carrito')

    await userEvent.click(checkbox('cebolla'))
    await userEvent.click(screen.getByText('Arroz'))

    expect(checkbox('cebolla')).toBeChecked()
    expect(checkbox('Arroz')).toBeChecked()
    expect(screen.getByText('2 de 4 en el carrito')).toBeInTheDocument()
  })

  it('remembers the checks on this device', async () => {
    fakeApi()
    renderAt('/shopping-list')
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Ya tengo bistec' }))

    cleanup()
    renderAt('/shopping-list')

    expect(await screen.findByRole('checkbox', { name: 'Ya tengo bistec' })).toBeChecked()
    expect(checkbox('cebolla')).not.toBeChecked()
  })

  it('keeps the checks of each plan apart', async () => {
    fakeApi({ planId: 'p1' })
    renderAt('/shopping-list')
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Ya tengo bistec' }))
    cleanup()

    fakeApi({ planId: 'p2' })
    renderAt('/shopping-list')

    expect(await screen.findByRole('checkbox', { name: 'Ya tengo bistec' })).not.toBeChecked()
  })

  it('unchecks everything at once', async () => {
    fakeApi()
    renderAt('/shopping-list')
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Ya tengo cebolla' }))
    await userEvent.click(checkbox('bistec'))

    await userEvent.click(screen.getByRole('button', { name: 'Desmarcar todo' }))

    expect(checkbox('cebolla')).not.toBeChecked()
    expect(checkbox('bistec')).not.toBeChecked()
    expect(screen.getByText('0 de 4 en el carrito')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desmarcar todo' })).not.toBeInTheDocument()
  })

  it('still works when the browser cannot save the checks', async () => {
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    try {
      fakeApi()
      renderAt('/shopping-list')

      await userEvent.click(await screen.findByRole('checkbox', { name: 'Ya tengo cebolla' }))

      expect(checkbox('cebolla')).toBeChecked()
    } finally {
      Storage.prototype.setItem = setItem
    }
  })

  it('leads to the plan when there is no plan yet', async () => {
    fakeApi({ planId: null })
    renderAt('/shopping-list')

    expect(
      await screen.findByRole('heading', { name: 'Todavía no hay una quincena' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Arma tu quincena' })).toHaveAttribute('href', '/plan')
  })

  it('leads to the plan when the plan has nothing to buy', async () => {
    fakeApi({ list: [] })
    renderAt('/shopping-list')

    expect(await screen.findByRole('heading', { name: 'Tu lista está vacía' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Arma tu quincena' })).toHaveAttribute('href', '/plan')
  })
})
