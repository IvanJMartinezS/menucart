import { describe, expect, it } from 'vitest'
import i18n from '../../i18n/index.ts'
import { formatQuantity } from './format.ts'

describe('formatQuantity', () => {
  it('uses the singular or the plural of the unit', async () => {
    await i18n.changeLanguage('es')

    expect(formatQuantity(i18n.t, 'es', 1, 'package')).toBe('1 paquete')
    expect(formatQuantity(i18n.t, 'es', 2, 'package')).toBe('2 paquetes')
    expect(formatQuantity(i18n.t, 'es', 1, 'unit')).toBe('1 unidad')
    expect(formatQuantity(i18n.t, 'es', 12, 'unit')).toBe('12 unidades')
  })

  it('writes decimals with the separator of the language', async () => {
    await i18n.changeLanguage('es')
    expect(formatQuantity(i18n.t, 'es', 1.5, 'kg')).toBe('1,5 kg')

    await i18n.changeLanguage('en')
    expect(formatQuantity(i18n.t, 'en', 1.5, 'kg')).toBe('1.5 kg')
    expect(formatQuantity(i18n.t, 'en', 3, 'package')).toBe('3 packages')
  })
})
