import { beforeEach, describe, expect, it } from 'vitest'
import type { ErrorBody } from '../src/lib/errors.ts'
import { request, resetDatabase } from './helpers.ts'

const grocery = {
  name: 'Harina de maíz',
  category: 'pantry',
  defaultQuantity: 2,
  unit: 'package',
  frequency: 'biweekly',
}

const createGrocery = (headers: Record<string, string>) =>
  request('/groceries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(grocery),
  })

const countGroceries = async () => (await (await request('/groceries')).json<unknown[]>()).length

beforeEach(resetDatabase)

describe('Protection against requests from other websites', () => {
  it('refuses writes sent from another website and saves nothing', async () => {
    const response = await createGrocery({ Origin: 'https://evil.example' })

    expect(response.status).toBe(403)
    expect(await response.json<ErrorBody>()).toEqual({
      error: 'forbidden',
      message: 'Requests from other websites are not allowed',
    })
    expect(await countGroceries()).toBe(0)
  })

  it('refuses writes that the browser marks as cross-site', async () => {
    const response = await createGrocery({ 'Sec-Fetch-Site': 'cross-site' })

    expect(response.status).toBe(403)
    expect(await countGroceries()).toBe(0)
  })

  it('refuses forms that try to sign out from another website', async () => {
    const response = await request('/auth/logout', {
      method: 'POST',
      headers: { Origin: 'null', 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    expect(response.status).toBe(403)
  })

  it('accepts writes from the web app', async () => {
    const response = await createGrocery({
      Origin: 'http://localhost:5173',
      'Sec-Fetch-Site': 'same-site',
    })

    expect(response.status).toBe(201)
  })

  it('accepts writes that do not come from a browser', async () => {
    const response = await createGrocery({})

    expect(response.status).toBe(201)
  })

  it('does not block reads', async () => {
    const response = await request('/groceries', { headers: { Origin: 'https://evil.example' } })

    expect(response.status).toBe(200)
  })
})
