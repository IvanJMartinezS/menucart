import { zodResolver } from '@hookform/resolvers/zod'
import { type LoginInput, loginInputSchema } from '@menucart/shared'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { FieldError } from '../components/ui/FieldError.tsx'
import { inputClassName } from '../components/ui/form-styles.ts'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { authErrorMessage } from '../features/auth/error-message.ts'
import { type LoginFormInput, useLogin } from '../features/auth/queries.ts'
import { safeRedirect } from '../features/auth/redirect.ts'

/** Sign in with email and password, then go back to the page the user wanted. */
export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInput, unknown, LoginInput>({ resolver: zodResolver(loginInputSchema) })

  const submit = handleSubmit(async (input) => {
    try {
      await login.mutateAsync(input)
      void navigate(safeRedirect(searchParams.get('redirect')), { replace: true })
    } catch {
      // The message is shown from `login.error`.
    }
  })

  return (
    <>
      <PageHeader
        eyebrow={t('auth.login.eyebrow')}
        title={t('auth.login.title')}
        description={t('auth.login.description')}
      />

      <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className="font-semibold">
            {t('auth.email')}
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className={inputClassName}
            {...register('email')}
          />
          {errors.email && <FieldError id="login-email-error">{t('auth.errors.email')}</FieldError>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="login-password" className="font-semibold">
            {t('auth.password')}
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            className={inputClassName}
            {...register('password')}
          />
          {errors.password && (
            <FieldError id="login-password-error">{t('auth.errors.password')}</FieldError>
          )}
        </div>

        {login.isError && (
          <p role="alert" className="rounded-2xl bg-accent-soft px-4 py-3 font-medium text-danger">
            {authErrorMessage(t, login.error)}
          </p>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {login.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>
      </form>

      <p className="mt-6 text-center text-muted">
        {t('auth.login.noAccount')}{' '}
        <Link
          to={{ pathname: '/register', search: searchParams.toString() }}
          className="font-semibold text-accent-strong underline underline-offset-4"
        >
          {t('auth.login.toRegister')}
        </Link>
      </p>
    </>
  )
}
