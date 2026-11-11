import { useTranslation } from 'react-i18next'
import { languages } from '../../i18n/index.ts'

/** Two-button switch between Spanish and English. The choice is remembered in the browser. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="flex rounded-full border border-line bg-surface p-0.5"
    >
      {languages.map((language) => {
        const isCurrent = i18n.resolvedLanguage === language

        return (
          <button
            key={language}
            type="button"
            lang={language}
            aria-label={t(`language.${language}`)}
            aria-pressed={isCurrent}
            onClick={() => void i18n.changeLanguage(language)}
            className={`min-h-10 min-w-11 rounded-full px-3 text-xs font-bold tracking-wider transition-colors ${
              isCurrent ? 'bg-ink text-cream' : 'text-muted hover:text-ink'
            }`}
          >
            {language.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
