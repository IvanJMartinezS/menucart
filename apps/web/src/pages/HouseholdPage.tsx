import { useQuery } from '@tanstack/react-query'
import { LogOut, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '../components/ui/ErrorState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { ChangePasswordForm } from '../features/auth/ChangePasswordForm.tsx'
import { accountQueryOptions, useLogout } from '../features/auth/queries.ts'
import { InvitePanel } from '../features/household/InvitePanel.tsx'
import { householdQueryOptions } from '../features/household/queries.ts'

/** Who shares the household, inviting the second person, the password and signing out. */
export function HouseholdPage() {
  const { t } = useTranslation()
  // Always there: this page is behind `RequireAccount`.
  const { data: account } = useQuery(accountQueryOptions)
  const household = useQuery(householdQueryOptions)
  const logout = useLogout()

  return (
    <>
      <PageHeader
        eyebrow={t('household.eyebrow')}
        title={t('household.title', { name: account?.household.name ?? '' })}
        description={t('household.description')}
      />

      <div className="flex max-w-xl flex-col gap-6">
        <section aria-labelledby="members-title">
          <h2 id="members-title" className="mb-2 font-display text-2xl font-medium">
            {t('household.members')}
          </h2>

          {household.isPending && (
            <p role="status" className="text-muted">
              {t('common.loading')}
            </p>
          )}
          {household.isError && (
            <ErrorState
              onRetry={() => void household.refetch()}
              isRetrying={household.isFetching}
            />
          )}
          {household.data && (
            <ul
              aria-labelledby="members-title"
              className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface"
            >
              {household.data.members.map((member) => (
                <li key={member.id} className="flex min-h-14 items-center gap-3 px-4">
                  <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                    <UserRound aria-hidden="true" className="size-5" />
                  </span>
                  <span className="font-semibold">
                    {member.name}
                    {member.id === account?.id && (
                      <span className="font-normal text-muted"> ({t('household.you')})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <InvitePanel inviterName={account?.name ?? ''} />

        <ChangePasswordForm />

        <div className="flex flex-col items-start gap-3">
          {logout.isError && (
            <p
              role="alert"
              className="rounded-2xl bg-accent-soft px-4 py-3 font-medium text-danger"
            >
              {t('household.logoutError')}
            </p>
          )}
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-6 font-semibold text-muted transition-colors hover:bg-line/60 hover:text-ink disabled:opacity-60"
          >
            <LogOut aria-hidden="true" className="size-5" />
            {logout.isPending ? t('household.loggingOut') : t('household.logout')}
          </button>
        </div>
      </div>
    </>
  )
}
