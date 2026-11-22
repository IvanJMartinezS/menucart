import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { testAccount } from '../test/accounts.ts'
import { mockApi } from '../test/mock-api.ts'
import { renderAt } from '../test/render.tsx'

const errorBody = (error: string) => ({ error, message: error })

async function fillIn({ password = 'una clave larga' } = {}) {
  await userEvent.type(screen.getByLabelText('Tu nombre'), 'Ana')
  await userEvent.type(screen.getByLabelText('Correo'), 'ana@mail.com')
  await userEvent.type(screen.getByLabelText('Contraseña'), password)
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

const registerFails = (status: number) =>
  mockApi([
    {
      method: 'POST',
      path: '/auth/register',
      respond: () => Response.json(errorBody('error'), { status }),
    },
  ])

describe('RegisterPage', () => {
  it('creates the account without a code and opens the app', async () => {
    const requests = mockApi([
      { method: 'POST', path: '/auth/register', respond: () => Response.json(testAccount) },
    ])
    const router = renderAt('/register', { account: null })

    await fillIn()
    await submit()

    await screen.findByRole('heading', { name: '¿Qué cocinamos esta quincena?' })
    expect(router.state.location.pathname).toBe('/menus')
    expect(requests.find((request) => request.path === '/auth/register')?.body).toEqual({
      name: 'Ana',
      email: 'ana@mail.com',
      password: 'una clave larga',
    })
  })

  it('takes the invitation code from the link and sends it clean', async () => {
    const requests = mockApi([
      { method: 'POST', path: '/auth/register', respond: () => Response.json(testAccount) },
    ])
    renderAt('/register?code=k7mq4xpn9r', { account: null })

    expect(screen.getByLabelText('Código de invitación (opcional)')).toHaveValue('K7MQ4-XPN9R')

    await fillIn()
    await submit()

    await screen.findByRole('heading', { name: '¿Qué cocinamos esta quincena?' })
    expect(requests.find((request) => request.path === '/auth/register')?.body).toMatchObject({
      invitationCode: 'K7MQ4XPN9R',
    })
  })

  it('checks the length of the password and the shape of the code', async () => {
    const requests = mockApi([])
    renderAt('/register', { account: null })

    await fillIn({ password: 'corta' })
    await userEvent.type(screen.getByLabelText('Código de invitación (opcional)'), 'K7MQ4')
    await submit()

    expect(
      await screen.findByText('La contraseña debe tener entre 10 y 128 caracteres.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('El código tiene 10 letras y números, como K7MQ4-XPN9R.'),
    ).toBeInTheDocument()
    expect(requests).toEqual([])
  })

  it.each([
    [
      400,
      'Ese código no funciona: puede que haya caducado o que ya se haya usado. Pide uno nuevo.',
    ],
    [409, 'Ya existe una cuenta con ese correo. Inicia sesión.'],
    [500, 'No pudimos completarlo. Revisa tu conexión e inténtalo de nuevo.'],
  ])('explains an answer %i of the API', async (status, message) => {
    registerFails(status)
    const router = renderAt('/register', { account: null })

    await fillIn()
    await submit()

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(router.state.location.pathname).toBe('/register')
  })

  it('links to the sign-in page without the invitation code', async () => {
    const router = renderAt('/register?code=K7MQ4XPN9R&redirect=%2Fplan', { account: null })

    await userEvent.click(screen.getByRole('link', { name: 'Inicia sesión' }))

    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('?redirect=%2Fplan')
  })
})
