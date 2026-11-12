import { describe, expect, it } from 'vitest'
import { groceryInputSchema } from './grocery.ts'

const validGrocery = {
  name: 'Harina de maíz',
  category: 'pantry',
  defaultQuantity: 2,
  unit: 'package',
  frequency: 'biweekly',
}

const isValidGrocery = (changes: object) =>
  groceryInputSchema.safeParse({ ...validGrocery, ...changes }).success

describe('groceryInputSchema', () => {
  it('accepts a valid grocery', () => {
    expect(isValidGrocery({})).toBe(true)
  })

  it('trims the name', () => {
    expect(groceryInputSchema.parse({ ...validGrocery, name: '  Arroz ' }).name).toBe('Arroz')
  })

  it('rejects an empty, blank or too long name', () => {
    expect(isValidGrocery({ name: '' })).toBe(false)
    expect(isValidGrocery({ name: '   ' })).toBe(false)
    expect(isValidGrocery({ name: 'a'.repeat(101) })).toBe(false)
  })

  it.each([1, 0.5, 1.25, 500, 999_999.99])('accepts the quantity %s', (defaultQuantity) => {
    expect(isValidGrocery({ defaultQuantity })).toBe(true)
  })

  it.each([0, -1, 1.234, 1_000_000, '2'])('rejects the quantity %s', (defaultQuantity) => {
    expect(isValidGrocery({ defaultQuantity })).toBe(false)
  })

  it.each(['pantry', 'deli'])('accepts the category %s', (category) => {
    expect(isValidGrocery({ category })).toBe(true)
  })

  it('rejects categories that belong to menus, not to groceries', () => {
    expect(isValidGrocery({ category: 'meat' })).toBe(false)
    expect(isValidGrocery({ category: 'vegetables' })).toBe(false)
  })

  it.each(['unit', 'kg', 'g', 'l', 'ml', 'package'])('accepts the unit %s', (unit) => {
    expect(isValidGrocery({ unit })).toBe(true)
  })

  it('rejects an unknown unit', () => {
    expect(isValidGrocery({ unit: 'cup' })).toBe(false)
  })

  it.each(['biweekly', 'monthly', 'occasional'])('accepts the frequency %s', (frequency) => {
    expect(isValidGrocery({ frequency })).toBe(true)
  })

  it('rejects an unknown frequency', () => {
    expect(isValidGrocery({ frequency: 'weekly' })).toBe(false)
  })

  it('requires every field', () => {
    for (const field of Object.keys(validGrocery)) {
      const { [field as keyof typeof validGrocery]: _, ...withoutField } = validGrocery
      expect(groceryInputSchema.safeParse(withoutField).success).toBe(false)
    }
  })
})
