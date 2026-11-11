/**
 * Integration tests use their own database (`menucart_test`) so they never touch development data.
 * In CI the same credentials are used, so the default URL works there too.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://menucart:menucart@localhost:5432/menucart_test'
