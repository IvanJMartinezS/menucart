import { z } from 'zod'

/** Shorter passwords are too easy to guess. */
export const PASSWORD_MIN_LENGTH = 10

/** Hashing is deliberately slow, so very long passwords are refused to protect the server. */
export const PASSWORD_MAX_LENGTH = 128

/** Emails are compared and saved in lowercase, so "Ana@Mail.com" and "ana@mail.com" are one account. */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254))

/**
 * Characters of invitation codes: digits and capital letters without the ones that look alike
 * (0 and O, 1, I and L), so a code can be read aloud or copied by hand without mistakes.
 */
export const INVITATION_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export const INVITATION_CODE_LENGTH = 10

/** Removes what people add when they type a code (spaces, the dash) and ignores capital letters. */
export const normalizeInvitationCode = (code: string) => code.replace(/[\s-]/g, '').toUpperCase()

/** Shows a code in two groups, easier to read: `K7MQ4XPN9R` → `K7MQ4-XPN9R`. */
export function formatInvitationCode(code: string) {
  const normalized = normalizeInvitationCode(code)
  const half = INVITATION_CODE_LENGTH / 2
  return `${normalized.slice(0, half)}-${normalized.slice(half)}`
}

/** An invitation code as people type it. It is normalized before checking its characters. */
export const invitationCodeSchema = z
  .string()
  .max(40)
  .transform(normalizeInvitationCode)
  .pipe(
    z
      .string()
      .length(INVITATION_CODE_LENGTH)
      .regex(new RegExp(`^[${INVITATION_CODE_ALPHABET}]+$`)),
  )

/**
 * Data needed to create an account. Without an invitation code the new user gets their own
 * household; with one, they join the household that invited them.
 */
export const registerInputSchema = z.object({
  name: z.string().trim().min(1).max(50),
  email: emailSchema,
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  invitationCode: invitationCodeSchema.optional(),
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
