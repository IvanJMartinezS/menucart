import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { testAccount } from '../test/accounts.ts'
import { mockApi } from '../test/mock-api.ts'
import { renderAt } from '../test/render.tsx'

const errorBody = (error: string) => ({ error, message: error })

async function signIn(email = 'Ana@Mail.com ', password = 'una clave larga') {
  await userEvent.type(screen.getByLabelText('Correo'), email)
  await userEvent.type(screen.getByLabelText('Contraseña'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginPage', () => {
  it('signs in and goes back to the page the user wanted', async () => {
    const requests = mockApi([
      { method: 'POST', path: '/auth/login', respond: () => Response.json(testAccount) },
      { method: 'GET', path: '/groceries', respond: () => Response.json([]) },
    ])
    const router = renderAt('/login?redirect=%2Fgroceries', { account: null })

    await signIn()

    expect(
      await screen.findByRole('heading', { name: 'Lo que siempre hace falta en casa' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/groceries')
    expect(requests.find((request) => request.path === '/auth/login')?.body).toEqual({
      email: 'ana@mail.com',
      password: 'una clave larga',
    })
  })

  it('goes to the menus when there is no page to go back to', async () => {
    mockApi([{ method: 'POST', path: '/auth/login', respond: () => Response.json(testAccount) }])
    const router = renderAt('/login', { account: null })

    await signIn()

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      '¿Qué cocinamos esta quincena?',
    )
    expect(router.state.location.pathname).toBe('/menus')
  })

  it.each(['//evil.example', '/\\evil.example', 'https://evil.example'])(
    'never goes to another website after signing in (%s)',
    async (redirect) => {
      mockApi([{ method: 'POST', path: '/auth/login', respond: () => Response.json(testAccount) }])
      const router = renderAt(`/login?redirect=${encodeURIComponent(redirect)}`, { account: null })

      await signIn()

      await screen.findByRole('heading', { name: '¿Qué cocinamos esta quincena?' })
      expect(router.state.location.pathname).toBe('/menus')
    },
  )

  it('says when the email or the password is not correct', async () => {
    mockApi([
      {
        method: 'POST',
        path: '/auth/login',
        respond: () => Response.json(errorBody('unauthorized'), { status: 401 }),
      },
    ])
    const router = renderAt('/login', { account: null })

    await signIn()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El correo o la contraseña no son correctos.',
    )
    expect(router.state.location.pathname).toBe('/login')
  })

  it('says how long to wait after too many attempts', async () => {
    mockApi([
      {
        method: 'POST',
        path: '/auth/login',
        respond: () =>
          Response.json(errorBody('too_many_requests'), {
            status: 429,
            headers: { 'Retry-After': '540' },
          }),
      },
    ])
    renderAt('/login', { account: null })

    await signIn()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Demasiados intentos fallidos. Espera 9 minutos y vuelve a intentarlo.',
    )
  })

  it('checks the fields before calling the API', async () => {
    const requests = mockApi([])
    renderAt('/login', { account: null })

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Escribe un correo válido.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument()
    expect(requests).toEqual([])
  })

  it('links to the registration, keeping the page to go back to', async () => {
    const router = renderAt('/login?redirect=%2Fplan', { account: null })

    await userEvent.click(screen.getByRole('link', { name: 'Créala aquí' }))

    expect(router.state.location.pathname).toBe('/register')
    expect(router.state.location.search).toBe('?redirect=%2Fplan')
  })
})
