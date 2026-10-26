import { describe, expect, it } from 'vitest'
import type { PeakRow, PeakView } from '../api/types'
import { cellText, COLUMNS, formatCell } from './columns'

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

  it("defines each of the server's sixteen columns and the three facts about a peak once", () => {
    expect(new Set(COLUMNS.map((column) => column.key)).size).toBe(19)
    expect(COLUMNS.length).toBe(19)
  })
})

describe('cellText', () => {
  const row = (kind: PeakRow['kind']): PeakRow => ({
    id: { kind: 'Peak', value: 1 },
    kind,
    values: { position: 1.34 } as PeakRow['values'],
    domain: null,
  })
  // Only the label and whether it is the parent matter to these columns.
  const peak = (label: string, isParent: boolean) => ({ label, isParent }) as PeakView

  it("shows the peak's label, or a dash when it has none", () => {
    expect(cellText('label', row('included'), peak('Caffeine', false))).toBe('Caffeine')
    expect(cellText('label', row('included'), peak('', false))).toBe('–')
  })

  it('ticks the parent peak only', () => {
    expect(cellText('parent', row('included'), peak('Caffeine', true))).toBe('✓')
    expect(cellText('parent', row('included'), peak('Caffeine', false))).toBe('')
  })

  it("leaves an included peak's status blank and names the others", () => {
    expect(cellText('status', row('included'), undefined)).toBe('')
    expect(cellText('status', row('excluded'), undefined)).toBe('Excluded')
    expect(cellText('status', row('unexpected'), undefined)).toBe('Unexpected')
  })

  it("formats a measured column's value", () => {
    expect(cellText('position', row('included'), undefined)).toBe('1.34')
  })
})
