import { describe, expect, it } from 'vitest'
import { menuIngredientInputSchema, menuInputSchema } from './menu.ts'

const validIngredient = { name: 'cebolla', quantity: 1, category: 'vegetables' }

const validMenu = {
  name: 'Bistec con ensalada y maduro',
  ingredients: [
    { name: 'bistec', quantity: 4, category: 'meat' },
    { name: 'maduro', quantity: 2, category: 'vegetables' },
    { name: 'tomate', quantity: 1, category: 'vegetables' },
  ],
}

const isValidMenu = (changes: object) =>
  menuInputSchema.safeParse({ ...validMenu, ...changes }).success

const isValidIngredient = (changes: object) =>
  menuIngredientInputSchema.safeParse({ ...validIngredient, ...changes }).success

describe('menuInputSchema', () => {
  it('accepts a valid menu', () => {
    expect(isValidMenu({})).toBe(true)
  })

  it('trims the name and the notes', () => {
    const menu = menuInputSchema.parse({ ...validMenu, name: '  Pabellón ', notes: ' 2 días ' })

    expect(menu.name).toBe('Pabellón')
    expect(menu.notes).toBe('2 días')
  })

  it('makes notes optional', () => {
    expect(menuInputSchema.parse(validMenu).notes).toBeUndefined()
  })

  it('rejects an empty or blank name', () => {
    expect(isValidMenu({ name: '' })).toBe(false)
    expect(isValidMenu({ name: '   ' })).toBe(false)
  })

  it('rejects a name longer than 120 characters', () => {
    expect(isValidMenu({ name: 'a'.repeat(121) })).toBe(false)
  })

  it('requires at least one ingredient', () => {
    expect(isValidMenu({ ingredients: [] })).toBe(false)
  })

  it('keeps the order of the ingredients', () => {
    const names = menuInputSchema.parse(validMenu).ingredients.map(({ name }) => name)

    expect(names).toEqual(['bistec', 'maduro', 'tomate'])
  })
})

describe('menuIngredientInputSchema', () => {
  it.each([1, 0.5, 1.1, 0.3, 1.25, 999_999.99])('accepts the quantity %s', (quantity) => {
    expect(isValidIngredient({ quantity })).toBe(true)
  })

  it.each([0, -1, 1.234, 1_000_000])('rejects the quantity %s', (quantity) => {
    expect(isValidIngredient({ quantity })).toBe(false)
  })

  it('rejects a quantity sent as text', () => {
    expect(isValidIngredient({ quantity: '1' })).toBe(false)
  })

  it('rejects a category that does not exist', () => {
    expect(isValidIngredient({ category: 'deli' })).toBe(false)
  })

  it('rejects a blank ingredient name', () => {
    expect(isValidIngredient({ name: '  ' })).toBe(false)
  })
})
