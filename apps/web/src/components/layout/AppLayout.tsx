import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router'
import { LanguageSwitcher } from './LanguageSwitcher.tsx'
import { navigationItems } from './navigation.ts'

/**
 * Frame shared by every page: the header with the brand, and the navigation.
 * On phones the navigation sits at the bottom, within reach of the thumb;
 * from tablet size up it moves to the header.
 */
export function AppLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
            Menu<span className="text-accent">Cart</span>
          </Link>

          <div className="flex items-center gap-4">
            <nav aria-label={t('nav.label')} className="hidden md:block">
              <ul className="flex gap-1">
                {navigationItems.map(({ to, labelKey }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-ink text-cream'
                            : 'text-muted hover:bg-line/60 hover:text-ink'
                        }`
                      }
                    >
                      {t(labelKey)}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 md:pb-12">
        <Outlet />
      </main>

      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-4">
          {navigationItems.map(({ to, labelKey, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
                    isActive ? 'text-accent' : 'text-muted hover:text-ink'
                  }`
                }
              >
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
                {t(labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
