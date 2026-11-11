import 'i18next'
import type { es } from './locales/es.ts'

// Makes `t('menus.title')` type-safe: a key that does not exist is a compile error.
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof es }
  }
}
