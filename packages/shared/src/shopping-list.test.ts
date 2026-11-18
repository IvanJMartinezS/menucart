import { describe, expect, it } from 'vitest'
import { buildShoppingList, normalizeName, type ShoppingListInput } from './shopping-list.ts'

type Ingredient = ShoppingListInput['menus'][number]['menu']['ingredients'][number]
type Grocery = ShoppingListInput['groceries'][number]

const vegetable = (name: string, quantity: number): Ingredient => ({
  name,
  quantity,
  category: 'vegetables',
})
const meat = (name: string, quantity: number): Ingredient => ({ name, quantity, category: 'meat' })

const planned = (name: string, ingredients: Ingredient[], times = 1) => ({
  times,
  menu: { name, ingredients },
})

const grocery = (
  name: string,
  quantity: number,
  unit: Grocery['unit'],
  category: Grocery['category'] = 'pantry',
): Grocery => ({
  name,
  quantity,
  unit,
  category,
})

const list = (input: Partial<ShoppingListInput>) =>
  buildShoppingList({ menus: [], groceries: [], ...input })

/** The list as "category: name quantity unit" lines, easy to compare. */
const lines = (input: Partial<ShoppingListInput>) =>
  list(input).flatMap(({ category, items }) =>
    items.map(
      ({ name, quantity, unit }) => `${category}: ${name} ${quantity}${unit ? ` ${unit}` : ''}`,
    ),
  )

describe('normalizeName', () => {
  it.each([
    ['Cebolla', 'cebolla'],
    ['  cebolla  ', 'cebolla'],
    ['Pimentón', 'pimenton'],
    ['CARNE   MECHADA', 'carne mechada'],
    ['Ñame', 'name'],
  ])('turns %s into %s', (name, expected) => {
    expect(normalizeName(name)).toBe(expected)
  })
})

describe('buildShoppingList', () => {
  it('is empty when the plan has nothing', () => {
    expect(list({})).toEqual([])
  })

  it('multiplies the ingredients by the times the menu is planned', () => {
    expect(lines({ menus: [planned('Bistec', [meat('bistec', 4)], 2)] })).toEqual([
      'meat: bistec 8',
    ])
  })

  it('adds up the same ingredient from several menus', () => {
    const menus = [
      planned('Pabellón', [vegetable('cebolla', 1)]),
      planned('Bistec', [vegetable('cebolla', 1)], 2),
      planned('Pollo', [vegetable('cebolla', 2)]),
    ]

    expect(lines({ menus })).toEqual(['vegetables: cebolla 5'])
  })

  it('treats names with other capital letters, accents or spaces as the same ingredient', () => {
    const menus = [
      planned('A', [vegetable('Pimentón', 1)]),
      planned('B', [vegetable('pimenton ', 1)]),
      planned('C', [vegetable('PIMENTÓN', 1)]),
    ]

    expect(list({ menus })[0]?.items).toHaveLength(1)
  })

  it('shows the most used spelling, or the first one on a tie', () => {
    const menus = [
      planned('A', [vegetable('Cebolla', 1)]),
      planned('B', [vegetable('cebolla', 1)]),
      planned('C', [vegetable('cebolla', 1)]),
      planned('D', [vegetable('Tomate', 1)]),
      planned('E', [vegetable('tomate', 1)]),
    ]

    expect(list({ menus })[0]?.items.map(({ name }) => name)).toEqual(['cebolla', 'Tomate'])
  })

  it('keeps singular and plural apart', () => {
    const menus = [planned('A', [vegetable('tomate', 1)]), planned('B', [vegetable('tomates', 2)])]

    expect(lines({ menus })).toEqual(['vegetables: tomate 1', 'vegetables: tomates 2'])
  })

  it('tells in which menus each ingredient is used, once per menu', () => {
    const menus = [
      planned('Pabellón', [vegetable('cebolla', 1), vegetable('Cebolla', 1)]),
      planned('Bistec', [vegetable('cebolla', 1)], 2),
    ]

    expect(list({ menus })[0]?.items[0]?.usedIn).toEqual(['Pabellón', 'Bistec'])
  })

  it('rounds the sums to two decimals', () => {
    const menus = [planned('A', [vegetable('ajo', 0.1)]), planned('B', [vegetable('ajo', 0.2)])]

    expect(list({ menus })[0]?.items[0]?.quantity).toBe(0.3)
  })

  it('adds up groceries with the same unit and keeps different units apart', () => {
    const groceries = [
      grocery('Arroz', 1, 'kg'),
      grocery('arroz', 2, 'kg'),
      grocery('Arroz', 500, 'g'),
    ]

    expect(lines({ groceries })).toEqual(['pantry: Arroz 3 kg', 'pantry: Arroz 500 g'])
  })

  it('never mixes a grocery with a menu ingredient of the same name', () => {
    const result = list({
      menus: [planned('Huevos fritos', [meat('huevos', 4)])],
      groceries: [grocery('Huevos', 30, 'unit')],
    })

    expect(
      result.map(({ category, items }) => [category, items.map(({ quantity }) => quantity)]),
    ).toEqual([
      ['meat', [4]],
      ['pantry', [30]],
    ])
  })

  it('orders the sections like a walk through the market, leaving out the empty ones', () => {
    const result = list({
      menus: [planned('A', [meat('pollo', 1), vegetable('papa', 3)])],
      groceries: [grocery('Café', 500, 'g'), grocery('Jamón', 250, 'g', 'deli')],
    })

    expect(result.map(({ category }) => category)).toEqual(['vegetables', 'meat', 'deli', 'pantry'])
    expect(
      list({ groceries: [grocery('Café', 500, 'g')] }).map(({ category }) => category),
    ).toEqual(['pantry'])
  })

  it('sorts the items of a section by name, ignoring capital letters and accents', () => {
    const menus = [
      planned('A', [
        vegetable('tomate', 1),
        vegetable('Ajo', 1),
        vegetable('ñame', 1),
        vegetable('cebolla', 1),
      ]),
    ]

    expect(list({ menus })[0]?.items.map(({ name }) => name)).toEqual([
      'Ajo',
      'cebolla',
      'ñame',
      'tomate',
    ])
  })

  it('builds a real two-week list', () => {
    const menus = [
      planned(
        'Bistec con ensalada y maduro',
        [
          meat('bistec', 4),
          vegetable('maduro', 2),
          vegetable('tomate', 1),
          vegetable('cebolla', 1),
          vegetable('lechuga', 1),
        ],
        2,
      ),
      planned('Pabellón criollo', [
        meat('carne para mechar', 1),
        vegetable('Cebolla', 1),
        vegetable('pimentón', 1),
      ]),
    ]
    const groceries = [
      grocery('Harina de maíz', 2, 'package'),
      grocery('Arroz', 2, 'kg'),
      grocery('Jamón', 500, 'g', 'deli'),
    ]

    expect(lines({ menus, groceries })).toEqual([
      'vegetables: cebolla 3',
      'vegetables: lechuga 2',
      'vegetables: maduro 4',
      'vegetables: pimentón 1',
      'vegetables: tomate 2',
      'meat: bistec 8',
      'meat: carne para mechar 1',
      'deli: Jamón 500 g',
      'pantry: Arroz 2 kg',
      'pantry: Harina de maíz 2 package',
    ])
  })
})
