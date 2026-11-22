import { zodResolver } from '@hookform/resolvers/zod'
import { formatInvitationCode, type RegisterInput, registerInputSchema } from '@menucart/shared'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { FieldError } from '../components/ui/FieldError.tsx'
import { inputClassName } from '../components/ui/form-styles.ts'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { authErrorMessage } from '../features/auth/error-message.ts'
import { type RegisterFormInput, useRegister } from '../features/auth/queries.ts'
import { safeRedirect } from '../features/auth/redirect.ts'

/** An empty optional field means "no code", not a code that is too short. */
const emptyToUndefined = (value: string) => (value.trim() === '' ? undefined : value)

/**
 * Create an account. Without an invitation code it starts a new household; with one (typed, or
 * taken from the link `/register?code=…`) it joins the household that sent it.
 */
export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createAccount = useRegister()
  const codeFromLink = searchParams.get('code')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput, unknown, RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: {
      invitationCode: codeFromLink ? formatInvitationCode(codeFromLink) : undefined,
    },
  })

  const submit = handleSubmit(async (input) => {
    try {
      await createAccount.mutateAsync(input)
      void navigate(safeRedirect(searchParams.get('redirect')), { replace: true })
    } catch {
      // The message is shown from `createAccount.error`.
    }
  })

  const loginSearch = new URLSearchParams(searchParams)
  loginSearch.delete('code')

  return (
    <>
      <PageHeader
        eyebrow={t('auth.register.eyebrow')}
        title={t('auth.register.title')}
        description={t('auth.register.description')}
      />

      <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="register-name" className="font-semibold">
            {t('auth.name')}
          </label>
          <input
            id="register-name"
            autoComplete="name"
            placeholder={t('auth.namePlaceholder')}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'register-name-error' : undefined}
            className={inputClassName}
            {...register('name')}
          />
          {errors.name && <FieldError id="register-name-error">{t('auth.errors.name')}</FieldError>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="register-email" className="font-semibold">
            {t('auth.email')}
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            className={inputClassName}
            {...register('email')}
          />
          {errors.email && (
            <FieldError id="register-email-error">{t('auth.errors.email')}</FieldError>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="register-password" className="font-semibold">
            {t('auth.password')}
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby="register-password-hint"
            className={inputClassName}
            {...register('password')}
          />
          {errors.password ? (
            <FieldError id="register-password-hint">{t('auth.errors.passwordLength')}</FieldError>
          ) : (
            <p id="register-password-hint" className="text-sm text-muted">
              {t('auth.register.passwordHint')}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="register-code" className="font-semibold">
            {t('auth.register.invitationCode')}
          </label>
          <input
            id="register-code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="K7MQ4-XPN9R"
            aria-invalid={errors.invitationCode ? true : undefined}
            aria-describedby="register-code-hint"
            className={`${inputClassName} font-mono tracking-wider uppercase`}
            {...register('invitationCode', { setValueAs: emptyToUndefined })}
          />
          {errors.invitationCode ? (
            <FieldError id="register-code-hint">{t('auth.errors.invitationCode')}</FieldError>
          ) : (
            <p id="register-code-hint" className="text-sm text-muted">
              {t('auth.register.invitationCodeHint')}
            </p>
          )}
        </div>

        {createAccount.isError && (
          <p role="alert" className="rounded-2xl bg-accent-soft px-4 py-3 font-medium text-danger">
            {authErrorMessage(t, createAccount.error)}
          </p>
        )}

        <button
          type="submit"
          disabled={createAccount.isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {createAccount.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>
      </form>

      <p className="mt-6 text-center text-muted">
        {t('auth.register.hasAccount')}{' '}
        <Link
          to={{ pathname: '/login', search: loginSearch.toString() }}
          className="font-semibold text-accent-strong underline underline-offset-4"
        >
          {t('auth.register.toLogin')}
        </Link>
      </p>
    </>
  )
}
