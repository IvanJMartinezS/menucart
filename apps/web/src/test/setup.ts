// Adds DOM matchers such as `toBeInTheDocument` and `toHaveAttribute` to `expect`.
import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'
import i18n from '../i18n/index.ts'

// Every test starts in Spanish with nothing remembered, whatever the language of the machine.
beforeEach(async () => {
  localStorage.clear()
  await i18n.changeLanguage('es')
})
