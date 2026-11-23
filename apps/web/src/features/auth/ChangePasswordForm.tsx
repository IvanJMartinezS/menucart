import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordErrors, changePasswordInputSchema } from '@menucart/shared'
import { KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { FieldError } from '../../components/ui/FieldError.tsx'
import { inputClassName } from '../../components/ui/form-styles.ts'
import { ApiError } from '../../lib/api.ts'
import { useChangePassword } from './queries.ts'

/**
 * The rules of the API, plus repeating the new password: that one is only checked here, to
 * catch typos before sending it.
 */
const formSchema = changePasswordInputSchema
  .and(z.object({ confirmPassword: z.string() }))
  .refine((input) => input.confirmPassword === input.newPassword, {
    message: 'mismatch',
    path: ['confirmPassword'],
  })

type FormInput = z.input<typeof formSchema>

/** Changes the password from the household page. */
export function ChangePasswordForm() {
  const { t } = useTranslation()
  const changePassword = useChangePassword()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(formSchema) })

  const newPasswordMessage =
    errors.newPassword?.message === changePasswordErrors.samePassword
      ? t('household.password.errors.same')
      : errors.newPassword && t('household.password.errors.newLength')

  const apiErrorMessage = (error: unknown) => {
    if (error instanceof ApiError && error.status === 400) {
      return t('household.password.errors.wrongCurrent')
    }
    if (error instanceof ApiError && error.status === 429) {
      return t('auth.errors.tooManyAttempts', {
        count: Math.max(1, Math.ceil((error.retryAfter ?? 60) / 60)),
      })
    }
    return t('auth.errors.generic')
  }

  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      // The fields are emptied: the passwords do not stay on the screen.
      reset()
    } catch {
      // The message is shown from `changePassword.error`.
    }
  })

  return (
    <section
      aria-labelledby="password-title"
      className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6"
    >
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <KeyRound aria-hidden="true" className="size-6" strokeWidth={1.75} />
        </span>
        <div>
          <h2 id="password-title" className="font-display text-2xl font-medium">
            {t('household.password.title')}
          </h2>
          <p className="mt-1 text-muted">{t('household.password.description')}</p>
        </div>
      </div>

      <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="password-current" className="font-semibold">
            {t('household.password.current')}
          </label>
          <input
            id="password-current"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.currentPassword ? true : undefined}
            aria-describedby={errors.currentPassword ? 'password-current-error' : undefined}
            className={inputClassName}
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <FieldError id="password-current-error">
              {t('household.password.errors.current')}
            </FieldError>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password-new" className="font-semibold">
            {t('household.password.new')}
          </label>
          <input
            id="password-new"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.newPassword ? true : undefined}
            aria-describedby="password-new-hint"
            className={inputClassName}
            {...register('newPassword')}
          />
          {newPasswordMessage ? (
            <FieldError id="password-new-hint">{newPasswordMessage}</FieldError>
          ) : (
            <p id="password-new-hint" className="text-sm text-muted">
              {t('household.password.newHint')}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password-confirm" className="font-semibold">
            {t('household.password.confirm')}
          </label>
          <input
            id="password-confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.confirmPassword ? true : undefined}
            aria-describedby={errors.confirmPassword ? 'password-confirm-error' : undefined}
            className={inputClassName}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <FieldError id="password-confirm-error">
              {t('household.password.errors.mismatch')}
            </FieldError>
          )}
        </div>

        {changePassword.isError && (
          <p role="alert" className="rounded-2xl bg-accent-soft px-4 py-3 font-medium text-danger">
            {apiErrorMessage(changePassword.error)}
          </p>
        )}
        {changePassword.isSuccess && (
          <p role="status" className="rounded-2xl bg-olive/10 px-4 py-3 font-medium text-olive">
            {t('household.password.success')}
          </p>
        )}

        <button
          type="submit"
          disabled={changePassword.isPending}
          className="inline-flex min-h-11 items-center justify-center self-start rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {changePassword.isPending
            ? t('household.password.submitting')
            : t('household.password.submit')}
        </button>
      </form>
    </section>
  )
}
