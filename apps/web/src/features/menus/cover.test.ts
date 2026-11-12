import { describe, expect, it } from 'vitest'
import { coverColorFor, coverColors } from './cover.ts'

describe('coverColorFor', () => {
  const ids = [
    '1c787887-1a98-42a1-a67d-4f9d017b4cf0',
    'c03af067-7989-4135-beb8-7e24a9f128ee',
    'beab391d-35f7-4a05-a62c-4d5c6e8ef7b3',
  ]

  it('always gives the same color to the same menu', () => {
    for (const id of ids) {
      expect(coverColorFor(id)).toBe(coverColorFor(id))
    }
  })

  it('only uses colors of the palette', () => {
    for (const id of ids) {
      expect(coverColors).toContain(coverColorFor(id))
    }
  })

  it('spreads menus across different colors', () => {
    const colors = new Set(Array.from({ length: 30 }, (_, index) => coverColorFor(`menu-${index}`)))

    expect(colors.size).toBeGreaterThan(3)
  })
})
