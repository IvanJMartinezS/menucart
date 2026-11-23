import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { testAccount } from '../../test/accounts.ts'
import { mockApi } from '../../test/mock-api.ts'
import { renderAt } from '../../test/render.tsx'

const householdRoute = {
  method: 'GET',
  path: '/households/current',
  respond: () =>
    Response.json({ ...testAccount.household, members: [{ id: testAccount.id, name: 'Ana' }] }),
}

const passwordRoute = (respond: () => Response) => ({
  method: 'PUT',
  path: '/auth/password',
  respond,
})

const form = () => within(screen.getByRole('region', { name: 'Cambiar contraseña' }))

async function fillIn({
  current = 'una clave larga',
  next = 'otra clave nueva',
  confirm = next,
}: { current?: string; next?: string; confirm?: string } = {}) {
  await userEvent.type(form().getByLabelText('Contraseña actual'), current)
  await userEvent.type(form().getByLabelText('Contraseña nueva'), next)
  await userEvent.type(form().getByLabelText('Repite la contraseña nueva'), confirm)
  await userEvent.click(form().getByRole('button', { name: 'Cambiar contraseña' }))
}

describe('ChangePasswordForm', () => {
  it('changes the password, says so and empties the fields', async () => {
    const requests = mockApi([
      householdRoute,
      passwordRoute(() => new Response(null, { status: 204 })),
    ])
    renderAt('/household')

    await fillIn()

    expect(await form().findByRole('status')).toHaveTextContent(
      'Contraseña cambiada. Cerramos la sesión en tus otros dispositivos.',
    )
    expect(requests.find((request) => request.path === '/auth/password')?.body).toEqual({
      currentPassword: 'una clave larga',
      newPassword: 'otra clave nueva',
    })
    expect(form().getByLabelText('Contraseña actual')).toHaveValue('')
    expect(form().getByLabelText('Contraseña nueva')).toHaveValue('')
  })

  it('checks the fields before calling the API', async () => {
    const requests = mockApi([householdRoute])
    renderAt('/household')

    await fillIn({ current: 'una clave larga', next: 'corta', confirm: 'distinta' })

    expect(
      await form().findByText('La contraseña nueva debe tener entre 10 y 128 caracteres.'),
    ).toBeInTheDocument()
    expect(form().getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(requests.some((request) => request.path === '/auth/password')).toBe(false)
  })

  it('asks for a new password different from the current one', async () => {
    mockApi([householdRoute])
    renderAt('/household')

    await fillIn({ current: 'una clave larga', next: 'una clave larga' })

    expect(
      await form().findByText('La contraseña nueva debe ser distinta de la actual.'),
    ).toBeInTheDocument()
  })

  it('says when the current password is wrong, without signing out', async () => {
    mockApi([
      householdRoute,
      passwordRoute(() =>
        Response.json({ error: 'bad_request', message: 'wrong' }, { status: 400 }),
      ),
    ])
    const router = renderAt('/household')

    await fillIn()

    expect(await form().findByRole('alert')).toHaveTextContent(
      'La contraseña actual no es correcta.',
    )
    expect(router.state.location.pathname).toBe('/household')
  })

  it('says how long to wait after too many attempts', async () => {
    mockApi([
      householdRoute,
      passwordRoute(() =>
        Response.json(
          { error: 'too_many_requests', message: 'wait' },
          { status: 429, headers: { 'Retry-After': '300' } },
        ),
      ),
    ])
    renderAt('/household')

    await fillIn()

    expect(await form().findByRole('alert')).toHaveTextContent(
      'Demasiados intentos fallidos. Espera 5 minutos y vuelve a intentarlo.',
    )
  })
})
