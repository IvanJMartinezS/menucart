import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockApi } from '../test/mock-api.ts'
import { renderAt } from '../test/render.tsx'

const menu = {
  id: 'c03af067-7989-4135-beb8-7e24a9f128ee',
  name: 'Pabellón criollo',
  notes: null,
  createdAt: '2026-11-11T12:00:00.000Z',
  updatedAt: '2026-11-11T12:00:00.000Z',
  ingredients: [{ id: 'a', name: 'carne', quantity: 1, category: 'meat', position: 0 }],
}

const openEditPage = async () => {
  const router = renderAt(`/menus/${menu.id}/edit`)
  await screen.findByRole('heading', { level: 1, name: menu.name })
  return router
}

const openDialog = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Borrar menú' }))
  return within(screen.getByRole('alertdialog', { name: '¿Borrar «Pabellón criollo»?' }))
}

const deleteRequests = (requests: { method: string }[]) =>
  requests.filter((request) => request.method === 'DELETE')

describe('delete menu', () => {
  it('asks for confirmation, naming the menu and warning that it cannot be undone', async () => {
    mockApi([{ method: 'GET', path: '/menus/:id', respond: () => Response.json(menu) }])
    await openEditPage()

    const dialog = await openDialog()

    expect(
      dialog.getByText('Se borrará el menú con todos sus ingredientes. No se puede deshacer.'),
    ).toBeInTheDocument()
    // The safe option has the focus, so pressing Enter by mistake does not delete.
    expect(dialog.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  })

  it('deletes nothing when cancelled', async () => {
    const requests = mockApi([
      { method: 'GET', path: '/menus/:id', respond: () => Response.json(menu) },
    ])
    await openEditPage()

    const dialog = await openDialog()
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(deleteRequests(requests)).toHaveLength(0)
  })

  it('closes with the Escape key', async () => {
    mockApi([{ method: 'GET', path: '/menus/:id', respond: () => Response.json(menu) }])
    await openEditPage()

    await openDialog()
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('deletes the menu and goes back to the catalog without it', async () => {
    let menus = [menu]
    const requests = mockApi([
      { method: 'GET', path: '/menus/:id', respond: () => Response.json(menu) },
      {
        method: 'DELETE',
        path: '/menus/:id',
        respond: () => {
          menus = []
          return new Response(null, { status: 204 })
        },
      },
      { method: 'GET', path: '/menus', respond: () => Response.json(menus) },
    ])
    const router = await openEditPage()

    const dialog = await openDialog()
    await userEvent.click(dialog.getByRole('button', { name: 'Sí, borrar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/menus'))
    expect(deleteRequests(requests)).toEqual([
      expect.objectContaining({ path: `/menus/${menu.id}` }),
    ])
    expect(await screen.findByText('Todavía no tienes menús')).toBeInTheDocument()
  })

  it('stays open and explains the problem when deleting fails', async () => {
    const requests = mockApi([
      { method: 'GET', path: '/menus/:id', respond: () => Response.json(menu) },
      {
        method: 'DELETE',
        path: '/menus/:id',
        respond: () => Response.json({ error: 'internal_error' }, { status: 500 }),
      },
    ])
    const router = await openEditPage()

    const dialog = await openDialog()
    await userEvent.click(dialog.getByRole('button', { name: 'Sí, borrar' }))

    expect(await dialog.findByRole('alert')).toHaveTextContent('No pudimos borrar el menú.')
    expect(router.state.location.pathname).toBe(`/menus/${menu.id}/edit`)
    expect(deleteRequests(requests)).toHaveLength(1)
  })
})
