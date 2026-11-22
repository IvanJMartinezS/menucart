import type { TFunction } from 'i18next'
import { ApiError } from '../../lib/api.ts'

/**
 * The message for a failed sign-in or registration. The API answers 401 for wrong credentials,
 * 409 for an email that already has an account, 400 for an invitation code that does not work
 * and 429 after too many failed attempts, telling how long to wait.
 */
export function authErrorMessage(t: TFunction, error: unknown) {
  if (!(error instanceof ApiError)) {
    return t('auth.errors.generic')
  }

  switch (error.status) {
    case 401:
      return t('auth.errors.invalidCredentials')
    case 409:
      return t('auth.errors.emailTaken')
    case 400:
      return t('auth.errors.invitationInvalid')
    case 429:
      return t('auth.errors.tooManyAttempts', {
        count: Math.max(1, Math.ceil((error.retryAfter ?? 60) / 60)),
      })
    default:
      return t('auth.errors.generic')
  }
}
