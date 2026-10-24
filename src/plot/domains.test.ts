import { describe, expect, it } from 'vitest'
import { withinDomains } from './domains'

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
