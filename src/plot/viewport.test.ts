import { describe, expect, it } from 'vitest'
import {
  clampToViewport,
  fitToVisible,
  fitWithin,
  followProportionally,
  pan,
  traceBounds,
  UNBOUNDED,
  wheelZoom,
  zoomAbout,
  zoomBoxOutcome,
  type Viewport,
} from './viewport'

const full: Viewport = { x: [0, 100], y: [0, 10] }
const minSpan = { x: 1, y: 0.1 }

describe('traceBounds', () => {
  it('spans the trace with margins below and above', () => {
    expect(
      traceBounds([
        [1, 0],
        [5, 100],
        [9, 20],
      ]),
    ).toEqual({
      full: { x: [1, 9], y: [-2, 105] },
      minSpan: { x: 0.01, y: 0.01 },
    })
  })
})

describe('pan', () => {
  it('shifts the domain by the delta', () => {
    expect(pan([10, 20], 5, [0, 100])).toEqual([15, 25])
  })

  it('stops at the low edge, keeping the span', () => {
    expect(pan([10, 20], -15, [0, 100])).toEqual([0, 10])
  })

  it('stops at the high edge, keeping the span', () => {
    expect(pan([80, 90], 15, [0, 100])).toEqual([90, 100])
  })
})

describe('UNBOUNDED', () => {
  it('lets a domain pan any distance', () => {
    expect(pan([0, 100], -1e6, UNBOUNDED)).toEqual([-1e6, -999900])
  })

  it('lets a domain widen any amount', () => {
    expect(fitWithin([-1e9, 1e9], UNBOUNDED)).toEqual([-1e9, 1e9])
  })
})

describe('fitWithin', () => {
  it('leaves a domain inside the full range alone', () => {
    expect(fitWithin([10, 20], [0, 100])).toEqual([10, 20])
  })

  it('shifts a domain hanging off the low edge back inside', () => {
    expect(fitWithin([-5, 15], [0, 100])).toEqual([0, 20])
  })

  it('shifts a domain hanging off the high edge back inside', () => {
    expect(fitWithin([90, 110], [0, 100])).toEqual([80, 100])
  })

  it('returns the full range for a domain wider than it', () => {
    expect(fitWithin([-10, 120], [0, 100])).toEqual([0, 100])
  })
})

describe('zoomAbout', () => {
  it('halves the span about the anchor', () => {
    expect(zoomAbout([0, 40], 10, 0.5, [0, 100], 1)).toEqual([5, 25])
  })

  it('doubles the span about the anchor, kept within the full range', () => {
    expect(zoomAbout([0, 40], 10, 2, [0, 100], 1)).toEqual([0, 80])
  })

  it('does not zoom in past the minimum span', () => {
    expect(zoomAbout([10, 11.5], 10.5, 0.5, [0, 100], 1)).toEqual([10, 11.5])
  })
})

describe('wheelZoom', () => {
  const view = { x: [20, 60], y: [2, 6], y2: null } as const

  it('zooms both axes in by 1.1 per notch about the pointer inside the plot', () => {
    const zoomed = wheelZoom(view, { x: 0.5, y: 0.5 }, -1, full, minSpan, null)
    expect(zoomed.x[0]).toBeCloseTo(21.818181818)
    expect(zoomed.x[1]).toBeCloseTo(58.181818182)
    expect(zoomed.y[0]).toBeCloseTo(2.181818182)
    expect(zoomed.y[1]).toBeCloseTo(5.818181818)
  })

  it('zooms both axes out by 1.2 per notch', () => {
    const zoomed = wheelZoom(view, { x: 0.5, y: 0.5 }, 1, full, minSpan, null)
    expect(zoomed.x[0]).toBeCloseTo(16)
    expect(zoomed.x[1]).toBeCloseTo(64)
    expect(zoomed.y[0]).toBeCloseTo(1.6)
    expect(zoomed.y[1]).toBeCloseTo(6.4)
  })

  it('zooms only y with the pointer over the y axis', () => {
    const zoomed = wheelZoom(view, { x: -0.1, y: 0.5 }, 1, full, minSpan, null)
    expect(zoomed.x).toEqual([20, 60])
    expect(zoomed.y[0]).toBeCloseTo(1.6)
    expect(zoomed.y[1]).toBeCloseTo(6.4)
  })

  it('zooms only x with the pointer over the x axis', () => {
    const zoomed = wheelZoom(view, { x: 0.5, y: -0.1 }, 1, full, minSpan, null)
    expect(zoomed.x[0]).toBeCloseTo(16)
    expect(zoomed.x[1]).toBeCloseTo(64)
    expect(zoomed.y).toEqual([2, 6])
  })

  describe('with the −y″ axis shown', () => {
    const withSecondary = { x: [20, 60], y: [2, 6], y2: [0, 100] } as const
    const secondary = { whole: [-500, 500] as const, minSpan: 1 }

    it('zooms −y″ in proportion with y inside the plot', () => {
      const zoomed = wheelZoom(withSecondary, { x: 0.5, y: 0.5 }, 1, full, minSpan, secondary)
      expect(zoomed.y[0]).toBeCloseTo(1.6)
      expect(zoomed.y[1]).toBeCloseTo(6.4)
      expect(zoomed.y2?.[0]).toBeCloseTo(-10)
      expect(zoomed.y2?.[1]).toBeCloseTo(110)
    })

    it('zooms only −y″ with the pointer over its axis, about the pointer', () => {
      const zoomed = wheelZoom(withSecondary, { x: 1.1, y: 0.25 }, 1, full, minSpan, secondary)
      expect(zoomed.x).toEqual([20, 60])
      expect(zoomed.y).toEqual([2, 6])
      expect(zoomed.y2?.[0]).toBeCloseTo(-5)
      expect(zoomed.y2?.[1]).toBeCloseTo(115)
    })

    it('starts −y″ from its whole range until the user has moved it', () => {
      const unmoved = { x: [20, 60], y: [2, 6], y2: null } as const
      const zoomed = wheelZoom(unmoved, { x: 0.5, y: 0.5 }, 1, full, minSpan, secondary)
      // The whole range, [-500, 500], zoomed out by 1.2 about its middle along with y. Following
      // y keeps the two in step, so −y″ is not held within its whole range as y is within its own.
      expect(zoomed.y2?.[0]).toBeCloseTo(-600)
      expect(zoomed.y2?.[1]).toBeCloseTo(600)
    })

    it('zooms −y″ out past its whole range over its axis, since it has no limits', () => {
      const atWhole = { x: [20, 60], y: [2, 6], y2: [-500, 500] } as const
      const zoomed = wheelZoom(atWhole, { x: 1.1, y: 0.5 }, 1, full, minSpan, secondary)
      expect(zoomed.y2?.[0]).toBeCloseTo(-600)
      expect(zoomed.y2?.[1]).toBeCloseTo(600)
    })

    it('leaves −y″ alone when zooming only y over the y axis', () => {
      const zoomed = wheelZoom(withSecondary, { x: -0.1, y: 0.5 }, 1, full, minSpan, secondary)
      expect(zoomed.y2).toEqual([0, 100])
    })
  })
})

describe('followProportionally', () => {
  it('zooms the other domain to the same fraction of its span', () => {
    // From the whole of [0, 10] to its middle fifth.
    expect(followProportionally([0, 10], [4, 6], [-100, 400])).toEqual([100, 200])
  })

  it('pans the other domain by the same fraction of its span', () => {
    // A tenth of the span upwards.
    expect(followProportionally([0, 10], [1, 11], [-100, 400])).toEqual([-50, 450])
  })
})

describe('clampToViewport', () => {
  it('moves an outside point onto the nearest edges', () => {
    expect(clampToViewport({ x: -5, y: 12 }, full)).toEqual({ x: 0, y: 10 })
  })

  it('leaves an inside point alone', () => {
    expect(clampToViewport({ x: 50, y: 5 }, full)).toEqual({ x: 50, y: 5 })
  })
})

describe('zoomBoxOutcome', () => {
  it('does nothing for a drag under 3% of the view', () => {
    expect(zoomBoxOutcome({ x: 50, y: 5 }, { x: 51, y: 5.1 }, full, minSpan)).toEqual({ kind: 'none' })
  })

  it('refuses a box narrower than the minimum span', () => {
    expect(zoomBoxOutcome({ x: 50, y: 2 }, { x: 50.5, y: 8 }, full, minSpan)).toEqual({ kind: 'tooSmall' })
  })

  it('zooms to the box, whichever way it was dragged', () => {
    expect(zoomBoxOutcome({ x: 60, y: 8 }, { x: 40, y: 2 }, full, minSpan)).toEqual({
      kind: 'zoom',
      viewport: { x: [40, 60], y: [2, 8] },
    })
  })
})

describe('fitToVisible', () => {
  const curve: [number, number][] = [
    [0, 5],
    [1, -2],
    [2, 8],
    [3, 4],
    [4, 100],
  ]

  it('spans only the points within the visible x range, with a 5% margin', () => {
    expect(fitToVisible(curve, [0.5, 3.5])).toEqual([-2.5, 8.5])
  })

  it('includes points exactly on the edges of the range', () => {
    expect(fitToVisible(curve, [1, 2])).toEqual([-2.5, 8.5])
  })

  it('gives a flat stretch some height', () => {
    expect(fitToVisible([[0, 10], [1, 10]], [0, 1])).toEqual([9.5, 10.5])
  })

  it('is null when no point is visible', () => {
    expect(fitToVisible(curve, [4.5, 6])).toBeNull()
  })
})
