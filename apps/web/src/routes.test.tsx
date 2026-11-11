import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from './routes.tsx'

/** Renders the whole app at a given URL, without a real browser. */
const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

/** The layout has two navigations (header and bottom bar); CSS shows only one of them. */
const firstNavigation = () => within(screen.getAllByRole('navigation', { name: 'Principal' })[0]!)

describe('app routes', () => {
  it.each([
    ['/', '¿Qué cocinamos esta quincena?'],
    ['/groceries', 'Lo que siempre hace falta en casa'],
    ['/plan', 'Arma tu quincena'],
    ['/shopping-list', 'Todo lo que hay que comprar'],
  ])('shows the right page at %s', (path, title) => {
    renderAt(path)

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  })

  it('navigates between sections and marks the current one', async () => {
    const router = renderAt('/')
    const navigation = firstNavigation()

    expect(navigation.getByRole('link', { name: 'Menús' })).toHaveAttribute('aria-current', 'page')

    await userEvent.click(navigation.getByRole('link', { name: 'Víveres' }))

    expect(router.state.location.pathname).toBe('/groceries')
    expect(navigation.getByRole('link', { name: 'Víveres' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(navigation.getByRole('link', { name: 'Menús' })).not.toHaveAttribute('aria-current')
  })

  it('shows a not found page with a way back for unknown addresses', async () => {
    const router = renderAt('/does-not-exist')

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Volver a los menús' }))

    expect(router.state.location.pathname).toBe('/')
  })
})
