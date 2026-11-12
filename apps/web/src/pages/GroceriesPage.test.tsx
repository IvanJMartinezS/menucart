import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockApi } from '../test/mock-api.ts'
import { renderAt } from '../test/render.tsx'

const grocery = (fields: Record<string, unknown>) => ({
  id: crypto.randomUUID(),
  createdAt: '2026-11-12T12:00:00.000Z',
  updatedAt: '2026-11-12T12:00:00.000Z',
  ...fields,
})

const harina = grocery({
  name: 'Harina de maíz',
  category: 'pantry',
  defaultQuantity: 2,
  unit: 'package',
  frequency: 'biweekly',
})
const arroz = grocery({
  name: 'Arroz',
  category: 'pantry',
  defaultQuantity: 1.5,
  unit: 'kg',
  frequency: 'monthly',
})
const jamon = grocery({
  name: 'Jamón',
  category: 'deli',
  defaultQuantity: 500,
  unit: 'g',
  frequency: 'occasional',
})

const panel = () => within(screen.getByRole('dialog'))

describe('groceries list', () => {
  it('groups groceries by category with their quantity and frequency', async () => {
    mockApi([
      { method: 'GET', path: '/groceries', respond: () => Response.json([arroz, harina, jamon]) },
    ])
    renderAt('/groceries')

    const pantry = within(await screen.findByRole('region', { name: 'Víveres' }))
    const deli = within(screen.getByRole('region', { name: 'Charcutería' }))

    expect(pantry.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringMatching(/Arroz.*1,5 kg.*Mensual/),
      expect.stringMatching(/Harina de maíz.*2 paquetes.*Quincenal/),
    ])
    expect(deli.getByRole('listitem')).toHaveTextContent(/Jamón.*500 g.*Eventual/)
  })

  it('hides a category with no groceries', async () => {
    mockApi([{ method: 'GET', path: '/groceries', respond: () => Response.json([harina]) }])
    renderAt('/groceries')

    await screen.findByRole('region', { name: 'Víveres' })

    expect(screen.queryByRole('region', { name: 'Charcutería' })).not.toBeInTheDocument()
  })

  it('offers to add the first grocery when there are none', async () => {
    mockApi([{ method: 'GET', path: '/groceries', respond: () => Response.json([]) }])
    renderAt('/groceries')

    await screen.findByText('Todavía no tienes víveres')

    expect(screen.getAllByRole('button', { name: 'Agregar víver' })).toHaveLength(1)
  })
})

describe('add a grocery', () => {
  it('saves it from the panel and shows it in the list', async () => {
    let saved: unknown[] = []
    const requests = mockApi([
      { method: 'GET', path: '/groceries', respond: () => Response.json(saved) },
      {
        method: 'POST',
        path: '/groceries',
        respond: () => {
          saved = [jamon]
          return Response.json(jamon, { status: 201 })
        },
      },
    ])
    renderAt('/groceries')

    await userEvent.click(await screen.findByRole('button', { name: 'Agregar víver' }))
    expect(panel().getByRole('heading', { name: 'Nuevo víver' })).toBeInTheDocument()
    expect(panel().getByLabelText('Nombre')).toHaveFocus()

    await userEvent.type(panel().getByLabelText('Nombre'), 'Jamón')
    await userEvent.clear(panel().getByLabelText('Cantidad que sueles comprar'))
    await userEvent.type(panel().getByLabelText('Cantidad que sueles comprar'), '500')
    await userEvent.selectOptions(panel().getByLabelText('Unidad'), 'g')
    await userEvent.click(panel().getByRole('radio', { name: 'Charcutería' }))
    await userEvent.click(panel().getByRole('radio', { name: 'Eventual' }))
    await userEvent.click(panel().getByRole('button', { name: 'Guardar víver' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(requests.find((request) => request.method === 'POST')?.body).toEqual({
      name: 'Jamón',
      category: 'deli',
      defaultQuantity: 500,
      unit: 'g',
      frequency: 'occasional',
    })
    expect(await screen.findByRole('region', { name: 'Charcutería' })).toHaveTextContent('Jamón')
  })

  it('starts as a biweekly pantry item', async () => {
    mockApi([{ method: 'GET', path: '/groceries', respond: () => Response.json([]) }])
    renderAt('/groceries')

    await userEvent.click(await screen.findByRole('button', { name: 'Agregar víver' }))

    expect(panel().getByRole('radio', { name: 'Víveres' })).toBeChecked()
    expect(panel().getByRole('radio', { name: 'Quincenal' })).toBeChecked()
  })

  it('explains a duplicate name in its field and keeps the panel open', async () => {
    mockApi([
      { method: 'GET', path: '/groceries', respond: () => Response.json([harina]) },
      {
        method: 'POST',
        path: '/groceries',
        respond: () => Response.json({ error: 'conflict' }, { status: 409 }),
      },
    ])
    renderAt('/groceries')

    await userEvent.click(await screen.findByRole('button', { name: 'Agregar víver' }))
    await userEvent.type(panel().getByLabelText('Nombre'), 'harina de maíz')
    await userEvent.click(panel().getByRole('button', { name: 'Guardar víver' }))

    expect(await panel().findByText('Ya tienes un víver con ese nombre.')).toBeInTheDocument()
    expect(panel().getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
    expect(panel().queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows what is missing and sends nothing when the form is not valid', async () => {
    const requests = mockApi([
      { method: 'GET', path: '/groceries', respond: () => Response.json([]) },
    ])
    renderAt('/groceries')

    await userEvent.click(await screen.findByRole('button', { name: 'Agregar víver' }))
    await userEvent.clear(panel().getByLabelText('Cantidad que sueles comprar'))
    await userEvent.type(panel().getByLabelText('Cantidad que sueles comprar'), '0')
    await userEvent.click(panel().getByRole('button', { name: 'Guardar víver' }))

    expect(await panel().findByText('Escribe el nombre del víver.')).toBeInTheDocument()
    expect(
      panel().getByText('Escribe una cantidad mayor que 0, con hasta 2 decimales.'),
    ).toBeInTheDocument()
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(0)
  })

  it('closes without saving when cancelled', async () => {
    const requests = mockApi([
      { method: 'GET', path: '/groceries', respond: () => Response.json([]) },
    ])
    renderAt('/groceries')

    await userEvent.click(await screen.findByRole('button', { name: 'Agregar víver' }))
    await userEvent.type(panel().getByLabelText('Nombre'), 'Café')
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(0)
  })
})

describe('edit a grocery', () => {
  it('opens the panel with its values and saves the changes', async () => {
    const requests = mockApi([
      { method: 'GET', path: '/groceries', respond: () => Response.json([harina]) },
      { method: 'PUT', path: '/groceries/:id', respond: () => Response.json(harina) },
    ])
    renderAt('/groceries')

    await userEvent.click(await screen.findByRole('button', { name: 'Editar Harina de maíz' }))
    expect(panel().getByRole('heading', { name: 'Editar víver' })).toBeInTheDocument()
    expect(panel().getByLabelText('Nombre')).toHaveValue('Harina de maíz')
    expect(panel().getByLabelText('Unidad')).toHaveValue('package')
    expect(panel().getByRole('radio', { name: 'Quincenal' })).toBeChecked()

    await userEvent.click(panel().getByRole('radio', { name: 'Mensual' }))
    await userEvent.click(panel().getByRole('button', { name: 'Guardar víver' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const put = requests.find((request) => request.method === 'PUT')
    expect(put?.path).toBe(`/groceries/${harina.id}`)
    expect(put?.body).toMatchObject({ name: 'Harina de maíz', frequency: 'monthly' })
  })
})

describe('delete a grocery', () => {
  it('asks for confirmation and removes it from the list', async () => {
    let saved = [harina, arroz]
    const requests = mockApi([
      { method: 'GET', path: '/groceries', respond: () => Response.json(saved) },
      {
        method: 'DELETE',
        path: '/groceries/:id',
        respond: () => {
          saved = [arroz]
          return new Response(null, { status: 204 })
        },
      },
    ])
    renderAt('/groceries')

    await userEvent.click(await screen.findByRole('button', { name: 'Borrar Harina de maíz' }))
    const dialog = within(screen.getByRole('alertdialog', { name: '¿Borrar «Harina de maíz»?' }))
    await userEvent.click(dialog.getByRole('button', { name: 'Sí, borrar' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(requests.find((request) => request.method === 'DELETE')?.path).toBe(
      `/groceries/${harina.id}`,
    )
    await waitFor(() => expect(screen.queryByText('Harina de maíz')).not.toBeInTheDocument())
    expect(screen.getByText('Arroz')).toBeInTheDocument()
  })
})
