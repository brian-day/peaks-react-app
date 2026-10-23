import { describe, expect, it } from 'vitest'
import type { PeakView, Point, XY } from '../api/types'
import { peakAt } from './hitTest'

function peak(id: number, low: Point, high: Point, envelope: XY[]): PeakView {
  const boundary = (point: Point) => ({ point, onTrace: true, integrationType: null })
  return {
    id: { kind: 'Peak', value: id },
    low: boundary(low),
    high: boundary(high),
    apex: { x: 0, y: 0 },
    envelope,
    isParent: false,
    label: '',
    moleculeId: null,
    editable: false,
    expected: true,
    excluded: false,
  }
}

// A triangle rising from (0, 0) to (1, 10) and back down to (2, 0), on a flat baseline.
const triangle = peak(1, { x: 0, y: 0 }, { x: 2, y: 0 }, [
  [0, 0],
  [1, 10],
  [2, 0],
])
// A second peak further along, on a baseline rising from 2 to 4.
const second = peak(2, { x: 3, y: 2 }, { x: 5, y: 4 }, [
  [3, 2],
  [4, 8],
  [5, 4],
])

describe('peakAt', () => {
  it('finds the peak whose area contains the point', () => {
    expect(peakAt({ x: 1, y: 5 }, [triangle, second])?.id).toEqual({ kind: 'Peak', value: 1 })
    expect(peakAt({ x: 4, y: 5 }, [triangle, second])?.id).toEqual({ kind: 'Peak', value: 2 })
  })

  it('interpolates the envelope between its points', () => {
    // At x = 0.5 the envelope is halfway up its first rise, at 5.
    expect(peakAt({ x: 0.5, y: 4.9 }, [triangle])).not.toBeNull()
    expect(peakAt({ x: 0.5, y: 5.1 }, [triangle])).toBeNull()
  })

  it('misses a point below a sloping baseline', () => {
    // At x = 4 the baseline is at 3.
    expect(peakAt({ x: 4, y: 2.9 }, [second])).toBeNull()
  })

  it('misses a point beside every peak', () => {
    expect(peakAt({ x: 2.5, y: 1 }, [triangle, second])).toBeNull()
  })

  it('still finds a peak whose baseline was dragged above its envelope', () => {
    const inverted = peak(3, { x: 0, y: 20 }, { x: 2, y: 20 }, [
      [0, 0],
      [1, 10],
      [2, 0],
    ])
    expect(peakAt({ x: 1, y: 15 }, [inverted])?.id).toEqual({ kind: 'Peak', value: 3 })
  })
})
