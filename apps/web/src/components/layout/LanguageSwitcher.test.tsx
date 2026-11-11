import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LANGUAGE_STORAGE_KEY } from '../../i18n/index.ts'
import { routes } from '../../routes.tsx'

const renderApp = () => {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/'] })} />)
}

const languageSwitcher = () => within(screen.getByRole('group', { name: /idioma|language/i }))

describe('LanguageSwitcher', () => {
  it('starts in Spanish', () => {
    renderApp()

    expect(languageSwitcher().getByRole('button', { name: 'Español' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '¿Qué cocinamos esta quincena?',
    )
  })

  it('translates the whole app to English', async () => {
    renderApp()

    await userEvent.click(languageSwitcher().getByRole('button', { name: 'English' }))

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'What are we cooking these two weeks?',
    )
    expect(screen.getAllByRole('link', { name: 'Groceries' })).not.toHaveLength(0)
    expect(languageSwitcher().getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('updates the language of the page for screen readers', async () => {
    renderApp()

    await userEvent.click(languageSwitcher().getByRole('button', { name: 'English' }))

    expect(document.documentElement).toHaveAttribute('lang', 'en')
  })

  it('remembers the chosen language', async () => {
    renderApp()

    await userEvent.click(languageSwitcher().getByRole('button', { name: 'English' }))

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })

  it('switches back to Spanish', async () => {
    renderApp()

    await userEvent.click(languageSwitcher().getByRole('button', { name: 'English' }))
    await userEvent.click(languageSwitcher().getByRole('button', { name: 'Español' }))

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '¿Qué cocinamos esta quincena?',
    )
    expect(document.documentElement).toHaveAttribute('lang', 'es')
  })
})
