// Adds DOM matchers such as `toBeInTheDocument` and `toHaveAttribute` to `expect`.
import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'
import i18n from '../i18n/index.ts'

beforeEach(async () => {
  // Every test starts in Spanish with nothing remembered, whatever the language of the machine.
  localStorage.clear()
  await i18n.changeLanguage('es')

  // Tests never call the real API: by default every request answers an empty list.
  // A test that needs other data replaces this with `vi.mocked(fetch).mockResolvedValueOnce(...)`.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json([])),
  )
})

// jsdom does not implement `<dialog>` yet: a minimal version of what the app uses.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
}
