import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { testAccount } from '../test/accounts.ts'
import { mockApi } from '../test/mock-api.ts'
import { renderAt } from '../test/render.tsx'

const household = {
  ...testAccount.household,
  members: [
    { id: testAccount.id, name: 'Ana' },
    { id: 'a1b2c3d4-0000-4000-8000-000000000002', name: 'Luis' },
  ],
}

const householdRoute = {
  method: 'GET',
  path: '/households/current',
  respond: () => Response.json(household),
}

const invitation = { code: 'K7MQ4-XPN9R', expiresAt: '2026-11-23T15:30:00.000Z' }

describe('HouseholdPage', () => {
  it('is reached from the header', async () => {
    mockApi([householdRoute, { method: 'GET', path: '/menus', respond: () => Response.json([]) }])
    const router = renderAt('/menus')

    await userEvent.click(screen.getByRole('link', { name: 'Mi hogar' }))

    expect(router.state.location.pathname).toBe('/household')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'El hogar de Ana' }),
    ).toBeInTheDocument()
  })

  it('lists the people of the household, marking the signed-in one', async () => {
    mockApi([householdRoute])
    renderAt('/household')

    const members = within(await screen.findByRole('list', { name: 'Quiénes están' }))
    expect(members.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Ana (tú)',
      'Luis',
    ])
  })

  it('creates an invitation code ready to copy or send by WhatsApp', async () => {
    const user = userEvent.setup()
    const requests = mockApi([
      householdRoute,
      {
        method: 'POST',
        path: '/households/invitations',
        respond: () => Response.json(invitation, { status: 201 }),
      },
    ])
    renderAt('/household')

    await user.click(screen.getByRole('button', { name: 'Crear código' }))

    expect(await screen.findByText('K7MQ4-XPN9R')).toBeInTheDocument()
    expect(screen.getByText(/^Caduca el /)).toBeInTheDocument()
    expect(requests.some((request) => request.path === '/households/invitations')).toBe(true)

    const link = `${window.location.origin}/register?code=K7MQ4-XPN9R`
    const whatsApp = screen.getByRole('link', { name: 'Compartir por WhatsApp' })
    const text = new URL(whatsApp.getAttribute('href')!).searchParams.get('text')
    expect(text).toContain('Ana te invita a su hogar en MenuCart')
    expect(text).toContain(link)

    await user.click(screen.getByRole('button', { name: 'Copiar enlace' }))

    expect(await screen.findByRole('button', { name: '¡Enlace copiado!' })).toBeInTheDocument()
    expect(await navigator.clipboard.readText()).toBe(link)
    expect(screen.getByRole('button', { name: 'Crear otro código' })).toBeInTheDocument()
  })

  it('says when the code could not be created', async () => {
    mockApi([
      householdRoute,
      {
        method: 'POST',
        path: '/households/invitations',
        respond: () => Response.json({ error: 'internal_error' }, { status: 500 }),
      },
    ])
    renderAt('/household')

    await userEvent.click(screen.getByRole('button', { name: 'Crear código' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos crear el código.')
  })

  it('signs out and forgets the data of the household', async () => {
    const requests = mockApi([
      householdRoute,
      { method: 'POST', path: '/auth/logout', respond: () => new Response(null, { status: 204 }) },
    ])
    const router = renderAt('/household')
    await screen.findByText('Luis')

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    // Straight to the sign-in page: the next person does not land on this household.
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('')
    expect(requests.some((request) => request.path === '/auth/logout')).toBe(true)
  })
})
