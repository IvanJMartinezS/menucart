import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { MenuCard } from './MenuCard.tsx'
import type { Menu } from './queries.ts'

const ingredient = (name: string, position: number) => ({
  id: `ingredient-${position}`,
  name,
  quantity: 1,
  category: 'vegetables' as const,
  position,
})

const menuWith = (names: string[]): Menu => ({
  id: 'c03af067-7989-4135-beb8-7e24a9f128ee',
  name: 'Bistec con ensalada y maduro',
  notes: null,
  createdAt: '2026-11-11T12:00:00.000Z',
  updatedAt: '2026-11-11T12:00:00.000Z',
  ingredients: names.map(ingredient),
})

/** The card contains a link, so it needs a router around it. */
const renderCard = (menu: Menu) =>
  render(
    <MemoryRouter>
      <MenuCard menu={menu} />
    </MemoryRouter>,
  )

describe('MenuCard', () => {
  it('shows the name as the title of the card', () => {
    renderCard(menuWith(['bistec']))

    expect(
      screen.getByRole('article', { name: 'Bistec con ensalada y maduro' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Bistec con ensalada y maduro' }),
    ).toBeInTheDocument()
  })

  it('lists all the ingredients when there are few', () => {
    renderCard(menuWith(['bistec', 'maduro', 'tomate']))

    expect(screen.getByText('3 ingredientes')).toBeInTheDocument()
    expect(screen.getByText('bistec, maduro, tomate')).toBeInTheDocument()
  })

  it('shows the first ingredients and how many more there are', () => {
    renderCard(menuWith(['bistec', 'maduro', 'tomate', 'cebolla', 'lechuga']))

    expect(screen.getByText('5 ingredientes')).toBeInTheDocument()
    expect(screen.getByText('bistec, maduro, tomate y 2 más')).toBeInTheDocument()
  })

  it('hides the decorative cover from screen readers', () => {
    const { container } = renderCard(menuWith(['bistec']))

    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('B')
  })

  it('opens the menu to edit it', () => {
    renderCard(menuWith(['bistec']))

    expect(screen.getByRole('link', { name: 'Bistec con ensalada y maduro' })).toHaveAttribute(
      'href',
      '/menus/c03af067-7989-4135-beb8-7e24a9f128ee/edit',
    )
  })
})
