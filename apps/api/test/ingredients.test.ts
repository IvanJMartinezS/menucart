import { beforeEach, describe, expect, it } from 'vitest'
import type { ErrorBody } from '../src/lib/errors.ts'
import { postJson, request, resetDatabase } from './helpers.ts'

type Suggestion = { name: string; category: string; uses: number }

const suggest = async (query: string) => {
  const response = await request(`/ingredients/suggestions?${query}`)
  return { status: response.status, body: await response.json<Suggestion[]>() }
}

const names = async (query: string) => (await suggest(query)).body.map(({ name }) => name)

beforeEach(async () => {
  await resetDatabase()

  await postJson('/menus', {
    name: 'Bistec encebollado',
    ingredients: [
      { name: 'bistec', quantity: 4, category: 'meat' },
      { name: 'Cebolla', quantity: 2, category: 'vegetables' },
      { name: 'Pimentón', quantity: 1, category: 'vegetables' },
    ],
  })
  await postJson('/menus', {
    name: 'Pabellón criollo',
    ingredients: [
      { name: 'carne mechada', quantity: 1, category: 'meat' },
      { name: 'cebolla', quantity: 1, category: 'vegetables' },
      { name: 'cebollín', quantity: 1, category: 'vegetables' },
    ],
  })
  await postJson('/menus', {
    name: 'Pollo guisado',
    ingredients: [
      { name: 'pollo', quantity: 1, category: 'meat' },
      { name: 'cebolla', quantity: 1, category: 'vegetables' },
    ],
  })
})

describe('GET /ingredients/suggestions', () => {
  it('groups the same ingredient written in different ways and counts its uses', async () => {
    const { status, body } = await suggest('q=ceb')

    expect(status).toBe(200)
    expect(body).toEqual([
      { name: 'cebolla', category: 'vegetables', uses: 3 },
      { name: 'cebollín', category: 'vegetables', uses: 1 },
    ])
  })

  it('ignores case and accents in the search', async () => {
    expect(await names('q=PIMENTON')).toEqual(['Pimentón'])
    expect(await names('q=cebollin')).toEqual(['cebollín'])
  })

  it('finds words in the middle of the name, after the ones that start with the search', async () => {
    await postJson('/menus', {
      name: 'Asado negro',
      ingredients: [{ name: 'mechada', quantity: 1, category: 'meat' }],
    })

    expect(await names('q=mechada')).toEqual(['mechada', 'carne mechada'])
  })

  it('treats % and _ as normal characters, not as wildcards', async () => {
    expect(await names('q=%25')).toEqual([])
    expect(await names('q=_')).toEqual([])
  })

  it('returns an empty list when nothing matches', async () => {
    expect(await names('q=queso')).toEqual([])
  })

  it('limits the number of suggestions', async () => {
    expect(await names('q=c&limit=1')).toHaveLength(1)
  })

  it.each([
    ['q is missing', ''],
    ['q is blank', 'q=%20%20'],
    ['limit is too high', 'q=ceb&limit=50'],
    ['limit is not a number', 'q=ceb&limit=many'],
  ])('answers 400 when %s', async (_, query) => {
    const response = await request(`/ingredients/suggestions?${query}`)

    expect(response.status).toBe(400)
    expect((await response.json<ErrorBody>()).error).toBe('validation_error')
  })
})

describe('SQL injection', () => {
  const attacks = [
    "'; DROP TABLE menus; --",
    "' OR '1'='1",
    "') UNION SELECT passwd FROM pg_shadow --",
    "'; UPDATE menus SET name = 'hacked'; --",
    "'; DELETE FROM menu_ingredients; --",
  ]

  it.each(attacks)('treats %s as plain text to search for', async (attack) => {
    const response = await request(`/ingredients/suggestions?q=${encodeURIComponent(attack)}`)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])

    // The data is still there and unchanged.
    const menus = await (await request('/menus')).json<{ name: string }[]>()
    expect(menus.map(({ name }) => name).sort()).toEqual([
      'Bistec encebollado',
      'Pabellón criollo',
      'Pollo guisado',
    ])
    expect((await suggest('q=ceb')).body).toHaveLength(2)
  })
})
