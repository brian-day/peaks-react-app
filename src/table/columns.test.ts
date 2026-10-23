import { describe, expect, it } from 'vitest'
import { COLUMNS, formatCell } from './columns'

describe('formatCell', () => {
  it('shows a missing value as a dash', () => {
    expect(formatCell(null)).toBe('–')
  })

  it('rounds numbers below 1000 to four significant figures', () => {
    expect(formatCell(16.6948)).toBe('16.69')
    expect(formatCell(1.3400001)).toBe('1.34')
    expect(formatCell(0.000123456)).toBe('0.0001235')
  })

  it('keeps every whole digit of numbers from 1000 up', () => {
    expect(formatCell(1102.234)).toBe('1,102')
    expect(formatCell(123456.7)).toBe('123,457')
  })

  it('shows an integration type as the letters of its two ends', () => {
    expect(formatCell({ low: 'Valley', high: 'Baseline' })).toBe('VB')
  })

  it('shows text as it is', () => {
    expect(formatCell('n/a')).toBe('n/a')
  })
})

describe('COLUMNS', () => {
  it('derives area units from both axes', () => {
    const area = COLUMNS.find((column) => column.key === 'area')
    expect(area?.units({ x: 'min', y: 'mAU' })).toBe('mAU·min')
  })

  it('defines each of the sixteen columns once', () => {
    expect(new Set(COLUMNS.map((column) => column.key)).size).toBe(16)
    expect(COLUMNS.length).toBe(16)
  })
})
