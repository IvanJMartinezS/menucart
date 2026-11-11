import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en.ts'
import { es } from './locales/es.ts'

export const resources = {
  es: { translation: es },
  en: { translation: en },
} as const

export type Language = keyof typeof resources

export const languages = Object.keys(resources) as Language[]

/** Key under which the chosen language is remembered in the browser. */
export const LANGUAGE_STORAGE_KEY = 'menucart.language'

// Keeps `<html lang>` in sync, so screen readers pronounce the texts in the right language.
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: languages,
    fallbackLng: 'es',
    // The language chosen in the app wins; otherwise, the language of the browser.
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    // React already escapes texts, so i18next does not need to.
    interpolation: { escapeValue: false },
  })

export default i18n
