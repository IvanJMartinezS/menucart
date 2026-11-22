import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { AuthShowcase } from './AuthShowcase.tsx'
import { LanguageSwitcher } from './LanguageSwitcher.tsx'

/**
 * Frame of the sign-in and registration pages. On phones, a single narrow column. On large
 * screens the screen is split: the brand panel on the left and the form, centered, on the right.
 */
export function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <aside className="hidden lg:block">
        <div className="sticky top-0 h-dvh">
          <AuthShowcase />
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="mx-auto flex h-16 w-full max-w-md items-center justify-between gap-4 px-4 lg:max-w-none lg:justify-end lg:px-12">
          <p className="font-display text-2xl font-semibold tracking-tight lg:hidden">
            Menu<span className="text-accent">Cart</span>
          </p>
          <LanguageSwitcher />
        </header>

        <main className="mx-auto w-full max-w-md flex-1 px-4 pt-6 pb-12 lg:flex lg:flex-col lg:justify-center lg:pt-0">
          <p className="mb-6 text-sm text-muted lg:hidden">{t('auth.tagline')}</p>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
