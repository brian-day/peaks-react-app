import { describe, expect, it } from 'vitest'
import type { PeakRow } from '../api/types'
import { groupByDomain } from './groups'

// Only the domain matters to grouping; the ID tells the rows apart.
function row(id: number, domain: number | null): PeakRow {
  return { id: { kind: 'Peak', value: id }, kind: 'included', values: {} as PeakRow['values'], domain }
}

describe('groupByDomain', () => {
  it('groups rows by domain in the domains order, keeping their order within each', () => {
    const a = row(1, 1)
    const b = row(2, 0)
    const c = row(3, 1)
    expect(groupByDomain([a, b, c], 2)).toEqual([
      { domain: 0, rows: [b] },
      { domain: 1, rows: [a, c] },
    ])
  })

  it('keeps a domain with no peaks as an empty group', () => {
    const a = row(1, 0)
    expect(groupByDomain([a], 3)).toEqual([
      { domain: 0, rows: [a] },
      { domain: 1, rows: [] },
      { domain: 2, rows: [] },
    ])
  })

  it('puts peaks in no domain, or in a domain not listed, last on their own', () => {
    const a = row(1, null)
    const b = row(2, 0)
    const c = row(3, 5)
    expect(groupByDomain([a, b, c], 1)).toEqual([
      { domain: 0, rows: [b] },
      { domain: null, rows: [a, c] },
    ])
  })

  it('is one group of every row when there are no domains', () => {
    const a = row(1, null)
    const b = row(2, null)
    expect(groupByDomain([a, b], 0)).toEqual([{ domain: null, rows: [a, b] }])
  })
})
