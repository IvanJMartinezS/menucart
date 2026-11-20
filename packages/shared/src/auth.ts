import { z } from 'zod'

/** Shorter passwords are too easy to guess. */
export const PASSWORD_MIN_LENGTH = 10

/** Hashing is deliberately slow, so very long passwords are refused to protect the server. */
export const PASSWORD_MAX_LENGTH = 128

/** Emails are compared and saved in lowercase, so "Ana@Mail.com" and "ana@mail.com" are one account. */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254))

/** Data needed to create an account. The new user gets their own household. */
export const registerInputSchema = z.object({
  name: z.string().trim().min(1).max(50),
  email: emailSchema,
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
})

/**
 * Data needed to sign in. The minimum length is not checked here: if the rules change,
 * older passwords must still work.
 */
export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
})

export type RegisterInput = z.infer<typeof registerInputSchema>
export type LoginInput = z.infer<typeof loginInputSchema>
