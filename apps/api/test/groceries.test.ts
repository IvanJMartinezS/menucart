import { beforeEach, describe, expect, it } from 'vitest'
import type { ErrorBody } from '../src/lib/errors.ts'
import { postJson, putJson, request, resetDatabase } from './helpers.ts'

type Grocery = {
  id: string
  name: string
  category: string
  defaultQuantity: number
  unit: string
  frequency: string
  createdAt: string
  updatedAt: string
}

const harina = {
  name: '  Harina de maíz ',
  category: 'pantry',
  defaultQuantity: 2,
  unit: 'package',
  frequency: 'biweekly',
}

const jamon = {
  name: 'Jamón',
  category: 'deli',
  defaultQuantity: 500,
  unit: 'g',
  frequency: 'biweekly',
}

const arroz = {
  name: 'arroz',
  category: 'pantry',
  defaultQuantity: 1.5,
  unit: 'kg',
  frequency: 'monthly',
}

/** A valid id that does not belong to any grocery. */
const missingId = '00000000-0000-4000-8000-000000000000'

const createGrocery = async (body: object) => (await postJson('/groceries', body)).json<Grocery>()

const listGroceries = async () => (await request('/groceries')).json<Grocery[]>()

beforeEach(resetDatabase)

describe('POST /groceries', () => {
  it('creates a grocery', async () => {
    const response = await postJson('/groceries', harina)

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      id: expect.any(String),
      name: 'Harina de maíz',
      category: 'pantry',
      defaultQuantity: 2,
      unit: 'package',
      frequency: 'biweekly',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  it('answers 409 when the name already exists, whatever its capital letters', async () => {
    await createGrocery(harina)

    const response = await postJson('/groceries', { ...harina, name: 'HARINA DE MAÍZ' })

    expect(response.status).toBe(409)
    expect(await response.json<ErrorBody>()).toEqual({
      error: 'conflict',
      message: 'A grocery with this name already exists',
    })
    expect(await listGroceries()).toHaveLength(1)
  })

  it('answers 400 with the invalid fields', async () => {
    const response = await postJson('/groceries', {
      ...harina,
      category: 'meat',
      defaultQuantity: 0,
      unit: 'cup',
    })
    const body = await response.json<ErrorBody>()

    expect(response.status).toBe(400)
    expect(body.details?.map(({ path }) => path)).toEqual(['category', 'defaultQuantity', 'unit'])
  })

  it('saves text that looks like SQL as plain text', async () => {
    const attack = "'); DROP TABLE groceries; --"

    const response = await postJson('/groceries', { ...harina, name: attack })

    expect(response.status).toBe(201)
    expect((await listGroceries()).map(({ name }) => name)).toEqual([attack])
  })
})

describe('GET /groceries', () => {
  it('returns an empty list when there are no groceries', async () => {
    expect(await listGroceries()).toEqual([])
  })

  it('groups groceries by category and sorts them by name, ignoring capital letters', async () => {
    await createGrocery(jamon)
    await createGrocery(harina)
    await createGrocery(arroz)

    const groceries = await listGroceries()

    expect(groceries.map(({ name, category }) => `${category}: ${name}`)).toEqual([
      'pantry: arroz',
      'pantry: Harina de maíz',
      'deli: Jamón',
    ])
  })

  it('returns quantities as numbers', async () => {
    await createGrocery(arroz)

    const [grocery] = await listGroceries()

    expect(grocery?.defaultQuantity).toBe(1.5)
  })
})

describe('GET /groceries/:id', () => {
  it('returns the grocery', async () => {
    const created = await createGrocery(harina)

    const response = await request(`/groceries/${created.id}`)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(created)
  })

  it('answers 404 when the grocery does not exist', async () => {
    const response = await request(`/groceries/${missingId}`)

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'not_found', message: 'Grocery not found' })
  })

  it('answers 400 when the id is not a valid uuid', async () => {
    expect((await request('/groceries/123')).status).toBe(400)
  })
})

describe('PUT /groceries/:id', () => {
  it('replaces the grocery', async () => {
    const created = await createGrocery(harina)

    const response = await putJson(`/groceries/${created.id}`, {
      ...harina,
      defaultQuantity: 3,
      frequency: 'monthly',
    })
    const updated = await response.json<Grocery>()

    expect(response.status).toBe(200)
    expect(updated).toMatchObject({ id: created.id, defaultQuantity: 3, frequency: 'monthly' })
    expect(updated.updatedAt).not.toBe(created.updatedAt)
    expect(await (await request(`/groceries/${created.id}`)).json()).toEqual(updated)
  })

  it('allows keeping the same name', async () => {
    const created = await createGrocery(harina)

    const response = await putJson(`/groceries/${created.id}`, { ...harina, defaultQuantity: 4 })

    expect(response.status).toBe(200)
  })

  it('answers 409 when renaming it to the name of another grocery', async () => {
    await createGrocery(harina)
    const created = await createGrocery(arroz)

    const response = await putJson(`/groceries/${created.id}`, { ...arroz, name: 'harina de maíz' })

    expect(response.status).toBe(409)
    expect((await (await request(`/groceries/${created.id}`)).json<Grocery>()).name).toBe('arroz')
  })

  it('answers 400 and changes nothing when the body is not valid', async () => {
    const created = await createGrocery(harina)

    const response = await putJson(`/groceries/${created.id}`, { ...harina, frequency: 'weekly' })

    expect(response.status).toBe(400)
    expect(await (await request(`/groceries/${created.id}`)).json()).toEqual(created)
  })

  it('answers 404 and creates nothing when the grocery does not exist', async () => {
    const response = await putJson(`/groceries/${missingId}`, harina)

    expect(response.status).toBe(404)
    expect(await listGroceries()).toEqual([])
  })
})

describe('DELETE /groceries/:id', () => {
  it('deletes the grocery', async () => {
    const created = await createGrocery(harina)
    const kept = await createGrocery(jamon)

    const response = await request(`/groceries/${created.id}`, { method: 'DELETE' })

    expect(response.status).toBe(204)
    expect(await listGroceries()).toEqual([kept])
  })

  it('answers 404 when the grocery does not exist', async () => {
    const response = await request(`/groceries/${missingId}`, { method: 'DELETE' })

    expect(response.status).toBe(404)
  })
})
