import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { testAccount } from '../../test/accounts.ts'
import { mockApi } from '../../test/mock-api.ts'
import { renderAt } from '../../test/render.tsx'

const unauthorized = () =>
  Response.json({ error: 'unauthorized', message: 'You need to sign in' }, { status: 401 })

describe('Pages that need a session', () => {
  it('send to the sign-in page, remembering the page the user wanted', async () => {
    const router = renderAt('/plan?view=chosen', { account: null })

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(new URLSearchParams(router.state.location.search).get('redirect')).toBe(
      '/plan?view=chosen',
    )
  })

  it('ask the API who is signed in when the app opens', async () => {
    mockApi([
      { method: 'GET', path: '/auth/me', respond: () => Response.json(testAccount) },
      { method: 'GET', path: '/groceries', respond: () => Response.json([]) },
    ])
    renderAt('/groceries', { account: 'from-api' })

    expect(
      await screen.findByRole('heading', { name: 'Lo que siempre hace falta en casa' }),
    ).toBeInTheDocument()
  })

  it('send to the sign-in page when the API says there is no session', async () => {
    mockApi([{ method: 'GET', path: '/auth/me', respond: unauthorized }])
    const router = renderAt('/groceries', { account: 'from-api' })

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('send to the sign-in page when the session ends while using the app', async () => {
    mockApi([{ method: 'GET', path: '/groceries', respond: unauthorized }])
    const router = renderAt('/groceries')

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    expect(new URLSearchParams(router.state.location.search).get('redirect')).toBe('/groceries')
  })

  it('offer to try again when the API cannot be reached', async () => {
    mockApi([
      {
        method: 'GET',
        path: '/auth/me',
        respond: () => Response.json({ error: 'internal_error' }, { status: 500 }),
      },
    ])
    renderAt('/groceries', { account: 'from-api' })

    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('Sign-in pages', () => {
  it('are skipped by someone already signed in', async () => {
    const router = renderAt('/login?redirect=%2Fshopping-list')

    expect(
      await screen.findByRole('heading', { name: 'Todo lo que hay que comprar' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/shopping-list')
  })
})
