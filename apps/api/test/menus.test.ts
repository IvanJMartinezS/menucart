import { beforeEach, describe, expect, it } from 'vitest'
import type { ErrorBody } from '../src/lib/errors.ts'
import { postJson, request, resetDatabase } from './helpers.ts'

type Ingredient = {
  id: string
  name: string
  quantity: number
  category: string
  position: number
}

type Menu = {
  id: string
  name: string
  notes: string | null
  createdAt: string
  updatedAt: string
  ingredients: Ingredient[]
}

const bistec = {
  name: '  Bistec con ensalada y maduro ',
  notes: 'Para 2 personas, 2 días',
  ingredients: [
    { name: 'bistec', quantity: 4, category: 'meat' },
    { name: 'maduro', quantity: 2, category: 'vegetables' },
    { name: 'tomate', quantity: 1.5, category: 'vegetables' },
  ],
}

const pabellon = {
  name: 'Pabellón criollo',
  ingredients: [{ name: 'carne mechada', quantity: 1, category: 'meat' }],
}

const listMenus = async () => (await request('/menus')).json<Menu[]>()

beforeEach(resetDatabase)

describe('POST /menus', () => {
  it('creates a menu with its ingredients', async () => {
    const response = await postJson('/menus', bistec)
    const menu = await response.json<Menu>()

    expect(response.status).toBe(201)
    expect(menu).toMatchObject({
      id: expect.any(String),
      name: 'Bistec con ensalada y maduro',
      notes: 'Para 2 personas, 2 días',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
    expect(menu.ingredients).toEqual([
      { id: expect.any(String), name: 'bistec', quantity: 4, category: 'meat', position: 0 },
      { id: expect.any(String), name: 'maduro', quantity: 2, category: 'vegetables', position: 1 },
      {
        id: expect.any(String),
        name: 'tomate',
        quantity: 1.5,
        category: 'vegetables',
        position: 2,
      },
    ])
  })

  it('stores notes as null when they are not sent', async () => {
    const menu = await (await postJson('/menus', pabellon)).json<Menu>()

    expect(menu.notes).toBeNull()
  })

  it('answers 400 with the invalid fields when the body is not valid', async () => {
    const response = await postJson('/menus', {
      name: '',
      ingredients: [{ name: 'sal', quantity: 0, category: 'spices' }],
    })
    const body = await response.json<ErrorBody>()

    expect(response.status).toBe(400)
    expect(body.error).toBe('validation_error')
    expect(body.details?.map(({ path }) => path)).toEqual([
      'name',
      'ingredients.0.quantity',
      'ingredients.0.category',
    ])
  })

  it('answers 400 when the body is not JSON', async () => {
    const response = await request('/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not json',
    })

    expect(response.status).toBe(400)
    expect((await response.json<ErrorBody>()).error).toBe('bad_request')
  })

  it('does not save anything when the body is not valid', async () => {
    await postJson('/menus', { ...bistec, ingredients: [] })

    expect(await listMenus()).toEqual([])
  })
})

describe('GET /menus', () => {
  it('returns an empty list when there are no menus', async () => {
    const response = await request('/menus')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('returns the menus newest first, with their ingredients in order', async () => {
    await postJson('/menus', bistec)
    await postJson('/menus', pabellon)

    const menus = await listMenus()

    expect(menus.map(({ name }) => name)).toEqual([
      'Pabellón criollo',
      'Bistec con ensalada y maduro',
    ])
    expect(menus[1]?.ingredients.map(({ name }) => name)).toEqual(['bistec', 'maduro', 'tomate'])
  })

  it('returns quantities as numbers, not as text', async () => {
    await postJson('/menus', bistec)

    const [menu] = await listMenus()

    expect(menu?.ingredients.map(({ quantity }) => quantity)).toEqual([4, 2, 1.5])
  })
})

describe('unknown routes', () => {
  it('answers 404 with the uniform error format', async () => {
    const response = await request('/does-not-exist')

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'not_found', message: 'Route not found' })
  })
})
