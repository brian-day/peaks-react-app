// Which peak a point falls in. The peaks let the pointer through to the zoom and pan layer
// beneath them, so they cannot tell when they are under it; this answers for them instead.

import type { PeakView, Point, XY } from '../api/types'

/** The peak whose area, between its baseline and envelope, contains `point`, if any. */
export function peakAt(point: Point, peaks: readonly PeakView[]): PeakView | null {
  for (const peak of peaks) {
    const { low, high } = peak
    if (point.x < low.point.x || point.x > high.point.x) continue

    const baseline = lineAt(low.point, high.point, point.x)
    const envelope = curveAt(peak.envelope, point.x) ?? baseline
    // Between the two, whichever is higher: a baseline dragged above the trace inverts the area.
    if (point.y >= Math.min(baseline, envelope) && point.y <= Math.max(baseline, envelope)) {
      return peak
    }
  }
  return null
}

function lineAt(a: Point, b: Point, x: number): number {
  return a.x === b.x ? a.y : a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y)
}

/** The curve's y at `x`, interpolated between its points; `null` outside it. */
function curveAt(points: readonly XY[], x: number): number | null {
  if (points.length === 0 || x < points[0][0] || x > points[points.length - 1][0]) return null

  // The first point at or after x, found by bisection; envelopes can be thousands of points long.
  let low = 0
  let high = points.length - 1
  while (low < high) {
    const mid = (low + high) >> 1
    if (points[mid][0] < x) low = mid + 1
    else high = mid
  }
  if (low === 0) return points[0][1]

  const [x0, y0] = points[low - 1]
  const [x1, y1] = points[low]
  return lineAt({ x: x0, y: y0 }, { x: x1, y: y1 }, x)
}
