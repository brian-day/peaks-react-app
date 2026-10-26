import { describe, expect, it } from 'vitest'
import { formatNumber, parseNumber } from './format'

describe('parseNumber', () => {
  it('reads plain and signed decimals', () => {
    expect(parseNumber('0.5')).toBe(0.5)
    expect(parseNumber(' -12.25 ')).toBe(-12.25)
    expect(parseNumber('1e-3')).toBe(0.001)
  })

  it('reads a value back as formatNumber wrote it', () => {
    expect(parseNumber(formatNumber(1102.234))).toBe(1102)
  })

  it('is null for anything that is not a finite number', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('Infinity')).toBeNull()
  })
})
