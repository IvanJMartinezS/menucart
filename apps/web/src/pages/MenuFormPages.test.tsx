import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockApi } from '../test/mock-api.ts'
import { renderAt } from '../test/render.tsx'

const savedMenu = {
  id: 'c03af067-7989-4135-beb8-7e24a9f128ee',
  name: 'Bistec con ensalada y maduro',
  notes: 'Para 2 días',
  createdAt: '2026-11-11T12:00:00.000Z',
  updatedAt: '2026-11-11T12:00:00.000Z',
  ingredients: [
    { id: 'a', name: 'bistec', quantity: 4, category: 'meat', position: 0 },
    { id: 'b', name: 'maduro', quantity: 2, category: 'vegetables', position: 1 },
  ],
}

const nameInput = () => screen.getByLabelText('Nombre del menú')
const ingredientInput = (number: number) => screen.getByLabelText(`Ingrediente ${number}`)
const quantityInput = (number: number) =>
  screen.getByLabelText(`Cantidad del ingrediente ${number}`)
const categorySelect = (number: number) =>
  screen.getByLabelText<HTMLSelectElement>(`Categoría del ingrediente ${number}`)
const saveButton = () => screen.getByRole('button', { name: 'Guardar menú' })

describe('new menu', () => {
  it('saves the menu with its ingredients and goes back to the catalog', async () => {
    const requests = mockApi([
      { method: 'POST', path: '/menus', respond: () => Response.json(savedMenu, { status: 201 }) },
      { method: 'GET', path: '/menus', respond: () => Response.json([savedMenu]) },
      { method: 'GET', path: '/ingredients/suggestions', respond: () => Response.json([]) },
    ])
    const router = renderAt('/menus/new')

    await userEvent.type(nameInput(), 'Bistec con ensalada y maduro')
    await userEvent.type(screen.getByLabelText('Notas (opcional)'), 'Para 2 días')
    await userEvent.clear(quantityInput(1))
    await userEvent.type(quantityInput(1), '4')
    await userEvent.type(ingredientInput(1), 'bistec')
    await userEvent.selectOptions(categorySelect(1), 'Carnes')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar ingrediente' }))
    await userEvent.clear(quantityInput(2))
    await userEvent.type(quantityInput(2), '1.5')
    await userEvent.type(ingredientInput(2), 'maduro')
    await userEvent.click(saveButton())

    await waitFor(() => expect(router.state.location.pathname).toBe('/menus'))
    expect(requests.find((request) => request.method === 'POST')?.body).toEqual({
      name: 'Bistec con ensalada y maduro',
      notes: 'Para 2 días',
      ingredients: [
        { name: 'bistec', quantity: 4, category: 'meat' },
        { name: 'maduro', quantity: 1.5, category: 'vegetables' },
      ],
    })
    expect(
      await screen.findByRole('link', { name: 'Bistec con ensalada y maduro' }),
    ).toBeInTheDocument()
  })

  it('does not send empty notes', async () => {
    const requests = mockApi([
      { method: 'POST', path: '/menus', respond: () => Response.json(savedMenu, { status: 201 }) },
      { method: 'GET', path: '/menus', respond: () => Response.json([]) },
      { method: 'GET', path: '/ingredients/suggestions', respond: () => Response.json([]) },
    ])
    renderAt('/menus/new')

    await userEvent.type(nameInput(), 'Pabellón')
    await userEvent.type(ingredientInput(1), 'carne')
    await userEvent.click(saveButton())

    await waitFor(() => expect(requests.some((request) => request.method === 'POST')).toBe(true))
    expect(requests.find((request) => request.method === 'POST')?.body).not.toHaveProperty('notes')
  })

  it('shows what is missing and sends nothing when the form is not valid', async () => {
    const requests = mockApi([])
    renderAt('/menus/new')

    await userEvent.clear(quantityInput(1))
    await userEvent.type(quantityInput(1), '0')
    await userEvent.click(saveButton())

    expect(await screen.findByText('Escribe el nombre del menú.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el ingrediente.')).toBeInTheDocument()
    expect(
      screen.getByText('Escribe una cantidad mayor que 0, con hasta 2 decimales.'),
    ).toBeInTheDocument()
    expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(0)
  })

  it('adds and removes ingredient rows, always keeping at least one', async () => {
    mockApi([])
    renderAt('/menus/new')

    const removeFirst = () => screen.getByRole('button', { name: 'Quitar ingrediente 1' })
    expect(removeFirst()).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Agregar ingrediente' }))
    expect(screen.getByLabelText('Ingrediente 2')).toBeInTheDocument()
    expect(removeFirst()).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Quitar ingrediente 2' }))
    expect(screen.queryByLabelText('Ingrediente 2')).not.toBeInTheDocument()
    expect(removeFirst()).toBeDisabled()
  })

  it('suggests ingredients used before and fills in their category', async () => {
    const requests = mockApi([
      {
        method: 'GET',
        path: '/ingredients/suggestions',
        respond: () => Response.json([{ name: 'bistec', category: 'meat', uses: 3 }]),
      },
    ])
    const { container } = { container: document.body }
    renderAt('/menus/new')

    await userEvent.type(ingredientInput(1), 'bis')
    await waitFor(() =>
      expect(container.querySelector('datalist option[value="bistec"]')).not.toBeNull(),
    )
    // Choosing an option of the list puts its whole name in the input at once.
    fireEvent.change(ingredientInput(1), { target: { value: 'bistec' } })

    await waitFor(() => expect(categorySelect(1).value).toBe('meat'))
    expect(
      requests.find((request) => request.path === '/ingredients/suggestions')?.query.get('q'),
    ).toBe('bis')
  })

  it('never replaces a category chosen by hand', async () => {
    mockApi([
      {
        method: 'GET',
        path: '/ingredients/suggestions',
        respond: () => Response.json([{ name: 'cebolla', category: 'vegetables', uses: 3 }]),
      },
    ])
    renderAt('/menus/new')

    await userEvent.selectOptions(categorySelect(1), 'Carnes')
    await userEvent.type(ingredientInput(1), 'cebolla')
    await waitFor(() =>
      expect(document.querySelector('datalist option[value="cebolla"]')).not.toBeNull(),
    )

    expect(categorySelect(1).value).toBe('meat')
  })

  it('keeps what was written and explains the problem when saving fails', async () => {
    mockApi([
      {
        method: 'POST',
        path: '/menus',
        respond: () => Response.json({ error: 'internal_error' }, { status: 500 }),
      },
      { method: 'GET', path: '/ingredients/suggestions', respond: () => Response.json([]) },
    ])
    const router = renderAt('/menus/new')

    await userEvent.type(nameInput(), 'Pabellón')
    await userEvent.type(ingredientInput(1), 'carne')
    await userEvent.click(saveButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos guardar el menú.')
    expect(nameInput()).toHaveValue('Pabellón')
    expect(router.state.location.pathname).toBe('/menus/new')
  })
})

describe('edit menu', () => {
  it('loads the menu into the form and saves the changes', async () => {
    const requests = mockApi([
      { method: 'GET', path: '/menus/:id', respond: () => Response.json(savedMenu) },
      { method: 'PUT', path: '/menus/:id', respond: () => Response.json(savedMenu) },
      { method: 'GET', path: '/menus', respond: () => Response.json([savedMenu]) },
    ])
    const router = renderAt(`/menus/${savedMenu.id}/edit`)

    expect(
      await screen.findByRole('heading', { level: 1, name: savedMenu.name }),
    ).toBeInTheDocument()
    expect(nameInput()).toHaveValue(savedMenu.name)
    expect(ingredientInput(2)).toHaveValue('maduro')
    expect(categorySelect(1).value).toBe('meat')

    await userEvent.clear(nameInput())
    await userEvent.type(nameInput(), 'Bistec encebollado')
    await userEvent.click(saveButton())

    await waitFor(() => expect(router.state.location.pathname).toBe('/menus'))
    const put = requests.find((request) => request.method === 'PUT')
    expect(put?.path).toBe(`/menus/${savedMenu.id}`)
    expect(put?.body).toMatchObject({ name: 'Bistec encebollado', notes: 'Para 2 días' })
  })

  it('does not ask for suggestions for the ingredients it loads', async () => {
    const requests = mockApi([
      { method: 'GET', path: '/menus/:id', respond: () => Response.json(savedMenu) },
    ])
    renderAt(`/menus/${savedMenu.id}/edit`)

    await screen.findByRole('heading', { level: 1, name: savedMenu.name })
    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(requests.filter((request) => request.path === '/ingredients/suggestions')).toHaveLength(
      0,
    )
  })

  it('says so when the menu does not exist', async () => {
    mockApi([])
    renderAt('/menus/00000000-0000-4000-8000-000000000000/edit')

    expect(await screen.findByRole('heading', { name: 'Este menú no existe' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a los menús' })).toHaveAttribute(
      'href',
      '/menus',
    )
  })
})

describe('catalog', () => {
  it('has a button to add a menu', async () => {
    mockApi([{ method: 'GET', path: '/menus', respond: () => Response.json([savedMenu]) }])
    const router = renderAt('/menus')

    await userEvent.click(await screen.findByRole('link', { name: 'Agregar menú' }))

    expect(router.state.location.pathname).toBe('/menus/new')
  })

  it('offers to add the first menu when there are none', async () => {
    mockApi([{ method: 'GET', path: '/menus', respond: () => Response.json([]) }])
    renderAt('/menus')

    await screen.findByText('Todavía no tienes menús')

    expect(screen.getAllByRole('link', { name: 'Agregar menú' })).toHaveLength(1)
  })
})
