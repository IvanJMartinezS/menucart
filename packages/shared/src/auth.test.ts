import { describe, expect, it } from 'vitest'
import {
  formatInvitationCode,
  invitationCodeSchema,
  normalizeInvitationCode,
  registerInputSchema,
} from './auth.ts'

const account = { name: 'Luis', email: 'luis@mail.com', password: 'una clave larga' }

describe('normalizeInvitationCode', () => {
  it('ignores spaces, dashes and capital letters', () => {
    expect(normalizeInvitationCode(' k7mq4-xpn9r ')).toBe('K7MQ4XPN9R')
    expect(normalizeInvitationCode('K7MQ4 XPN9R')).toBe('K7MQ4XPN9R')
  })
})

describe('formatInvitationCode', () => {
  it('shows the code in two groups of five', () => {
    expect(formatInvitationCode('k7mq4xpn9r')).toBe('K7MQ4-XPN9R')
  })
})

describe('invitationCodeSchema', () => {
  it('accepts a code however it is typed', () => {
    expect(invitationCodeSchema.parse('k7mq4 - xpn9r')).toBe('K7MQ4XPN9R')
  })

  it('refuses codes with the wrong length', () => {
    expect(invitationCodeSchema.safeParse('K7MQ4-XPN9').success).toBe(false)
    expect(invitationCodeSchema.safeParse('K7MQ4-XPN9RR').success).toBe(false)
    expect(invitationCodeSchema.safeParse('').success).toBe(false)
  })

  it('refuses characters that codes never have', () => {
    for (const code of [
      'K7MQ4-XPN90',
      'K7MQ4-XPN9O',
      'K7MQ4-XPN91',
      'K7MQ4-XPN9I',
      "K7MQ4-XPN9'",
    ]) {
      expect(invitationCodeSchema.safeParse(code).success).toBe(false)
    }
  })
})

describe('registerInputSchema', () => {
  it('does not need an invitation code', () => {
    expect(registerInputSchema.parse(account)).toEqual(account)
  })

  it('normalizes the invitation code', () => {
    expect(registerInputSchema.parse({ ...account, invitationCode: 'k7mq4-xpn9r' })).toEqual({
      ...account,
      invitationCode: 'K7MQ4XPN9R',
    })
  })
})
