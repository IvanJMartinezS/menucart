import type { Account } from '../features/auth/queries.ts'

/** The account signed in by default in the tests. */
export const testAccount: Account = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  name: 'Ana',
  email: 'ana@mail.com',
  household: { id: 'a1b2c3d4-0000-4000-8000-0000000000aa', name: 'Ana' },
}
