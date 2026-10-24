import { describe, expect, it } from 'vitest'
import { neighbourLimits, withinDomains } from './domains'

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
