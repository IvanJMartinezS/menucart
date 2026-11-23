import {
  formatInvitationCode,
  INVITATION_CODE_ALPHABET,
  INVITATION_CODE_LENGTH,
} from '@menucart/shared'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'
import type { Database, Executor } from '../db/client.ts'
import { householdInvitations } from '../db/schema.ts'
import { sha256Hex } from './encoding.ts'

/** How long a code works after it is created. */
export const INVITATION_DURATION_MS = 24 * 60 * 60 * 1000

/** The duration as a Postgres interval: the database dates the codes and checks them. */
const invitationDuration = sql.raw(`interval '${INVITATION_DURATION_MS / 1000} seconds'`)

/**
 * A new random code from a secure generator. Bytes that would favor some characters
 * (256 is not a multiple of the alphabet size) are thrown away, so every character is
 * equally likely.
 */
export function generateInvitationCode() {
  const size = INVITATION_CODE_ALPHABET.length
  const limit = 256 - (256 % size)
  let code = ''

  while (code.length < INVITATION_CODE_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(INVITATION_CODE_LENGTH))) {
      if (byte < limit && code.length < INVITATION_CODE_LENGTH) {
        code += INVITATION_CODE_ALPHABET[byte % size]
      }
    }
  }

  return code
}

/** SHA-256 of the normalized code: the only thing saved in the database. */
export const hashInvitationCode = (code: string) => sha256Hex(code)

/**
 * Creates a code to join the household. Unused codes of the household stop working, so
 * there is only one valid code at a time. The code is returned once and never saved.
 */
export async function createInvitation(db: Database, householdId: string, createdBy: string) {
  const code = generateInvitationCode()

  // The database dates the code, with the same clock it uses to check it later.
  const expiresAt = await db.transaction(async (tx) => {
    await tx
      .delete(householdInvitations)
      .where(
        and(eq(householdInvitations.householdId, householdId), isNull(householdInvitations.usedAt)),
      )
    const [created] = await tx
      .insert(householdInvitations)
      .values({
        householdId,
        createdBy,
        codeHash: await hashInvitationCode(code),
        expiresAt: sql`now() + ${invitationDuration}`,
      })
      .returning({ expiresAt: householdInvitations.expiresAt })

    return created!.expiresAt
  })

  return { code: formatInvitationCode(code), expiresAt }
}

/**
 * Uses a code (already normalized) and returns the household it belongs to, or null when it
 * does not exist, has expired or was already used. A single update checks and marks the code,
 * so two people using it at the same time cannot both join.
 */
export async function claimInvitation(db: Executor, code: string) {
  const [invitation] = await db
    .update(householdInvitations)
    .set({ usedAt: sql`now()` })
    .where(
      and(
        eq(householdInvitations.codeHash, await hashInvitationCode(code)),
        isNull(householdInvitations.usedAt),
        gt(householdInvitations.expiresAt, sql`now()`),
      ),
    )
    .returning({ id: householdInvitations.id, householdId: householdInvitations.householdId })

  return invitation ?? null
}

/** Records who joined with the code. */
export async function markInvitationUsedBy(db: Executor, invitationId: string, userId: string) {
  await db
    .update(householdInvitations)
    .set({ usedBy: userId })
    .where(eq(householdInvitations.id, invitationId))
}
