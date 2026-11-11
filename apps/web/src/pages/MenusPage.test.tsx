import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderAt } from '../test/render.tsx'

const menus = [
  {
    id: '1',
    name: 'Pabellón criollo',
    notes: null,
    createdAt: '2026-11-11T12:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
    ingredients: [{ id: 'a', name: 'carne', quantity: 1, category: 'meat', position: 0 }],
  },
  {
    id: '2',
    name: 'Bistec con ensalada y maduro',
    notes: null,
    createdAt: '2026-11-10T12:00:00.000Z',
    updatedAt: '2026-11-10T12:00:00.000Z',
    ingredients: [
      { id: 'b', name: 'bistec', quantity: 4, category: 'meat', position: 0 },
      { id: 'c', name: 'maduro', quantity: 2, category: 'vegetables', position: 1 },
      { id: 'd', name: 'tomate', quantity: 1, category: 'vegetables', position: 2 },
    ],
  },
]

describe('MenusPage', () => {
  it('asks the API for the menus', async () => {
    renderAt('/')

    await screen.findByText('Todavía no tienes menús')

    const [url] = vi.mocked(fetch).mock.calls[0]!
    expect(String(url)).toBe('http://api.test/menus')
  })

  it('shows a loading message while the menus arrive', () => {
    vi.mocked(fetch).mockReturnValueOnce(new Promise(() => {}))

    renderAt('/')

    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
  })

  it('shows the empty state when there are no menus', async () => {
    renderAt('/')

    expect(await screen.findByText('Todavía no tienes menús')).toBeInTheDocument()
  })

  it('lists the menus with their number of ingredients', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(menus))

    renderAt('/')

    expect(await screen.findByText('Pabellón criollo')).toBeInTheDocument()
    expect(screen.getByText('1 ingrediente')).toBeInTheDocument()
    expect(screen.getByText('Bistec con ensalada y maduro')).toBeInTheDocument()
    expect(screen.getByText('3 ingredientes')).toBeInTheDocument()
  })

  it('shows an error with a way to try again when the API fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ error: 'internal_error' }, { status: 500 }))
      .mockResolvedValueOnce(Response.json(menus))

    renderAt('/')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos conectar con el servidor',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Pabellón criollo')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the same error when the API cannot be reached', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    renderAt('/')

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
