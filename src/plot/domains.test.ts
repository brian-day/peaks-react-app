import { describe, expect, it } from 'vitest'
import { hasGaps, neighbourLimits, snapDomains, withinDomains } from './domains'

const curve: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
]

describe('withinDomains', () => {
  it('keeps only the points in each domain, ends included, one stretch per domain', () => {
    expect(
      withinDomains(curve, [
        [1, 2],
        [4, 5],
      ]),
    ).toEqual([
      [
        [1, 2],
        [2, 3],
      ],
      [
        [4, 5],
        [5, 6],
      ],
    ])
  })

  it('leaves out a domain no point falls in', () => {
    expect(withinDomains(curve, [[2.2, 2.8]])).toEqual([])
  })

  it('is the whole curve when there are no domains', () => {
    expect(withinDomains(curve, null)).toEqual([curve])
  })
})

describe('neighbourLimits', () => {
  const domains = [
    { start: 1, end: 3 },
    { start: 5, end: 8 },
    { start: 10, end: 12 },
  ]

  it('stops a middle domain at the domains either side', () => {
    expect(neighbourLimits(domains, 1)).toEqual([3, 10])
  })

  it('leaves the outer ends of the first and last domains unlimited', () => {
    expect(neighbourLimits(domains, 0)).toEqual([-Infinity, 5])
    expect(neighbourLimits(domains, 2)).toEqual([8, Infinity])
  })
})

describe('snapDomains', () => {
  const domains = [
    { start: 1, end: 3 },
    { start: 5, end: 8 },
    { start: 8, end: 9 },
    { start: 12, end: 14 },
  ]

  it('snapping left starts each domain where the one before it ends', () => {
    expect(snapDomains(domains, 'left')).toEqual([
      [1, 3],
      [3, 8],
      [8, 9],
      [9, 14],
    ])
  })

  it('snapping right ends each domain where the one after it starts', () => {
    expect(snapDomains(domains, 'right')).toEqual([
      [1, 5],
      [5, 8],
      [8, 12],
      [12, 14],
    ])
  })

  it('snapping center meets halfway across each gap', () => {
    expect(snapDomains(domains, 'center')).toEqual([
      [1, 4],
      [4, 8],
      [8, 10.5],
      [10.5, 14],
    ])
  })

  it('leaves a single domain as it is', () => {
    expect(snapDomains([{ start: 1, end: 3 }], 'center')).toEqual([[1, 3]])
  })
})

describe('hasGaps', () => {
  it('is true when a domain ends before the next starts', () => {
    expect(
      hasGaps([
        { start: 1, end: 3 },
        { start: 4, end: 6 },
      ]),
    ).toBe(true)
  })

  it('is false when every domain ends where the next starts', () => {
    expect(
      hasGaps([
        { start: 1, end: 3 },
        { start: 3, end: 6 },
      ]),
    ).toBe(false)
  })
})
