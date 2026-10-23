// The shapes of the markers drawn at a peak's apex and ends, as SVG paths in pixels. Each kind of
// boundary has its own shape, as in the Mathematica preview, so the integration type can be read
// off the plot.

import type { CurvatureBoundaryType } from '../api/types'

/** The markers' size: a disc's radius, and the scale every other shape is drawn to. */
export const MARKER_RADIUS = 4

// An equilateral triangle that fits the marker's circle: half its base is 2/√3 of its half-height.
const TRIANGLE_HALF_BASE = 2 / Math.sqrt(3)
// The shoulder's diamond is a little taller than it is wide.
const DIAMOND_HALF_HEIGHT = 1.2

/** A path for the marker at a boundary of the given type, centred on `(x, y)`. */
export function boundaryMarkerPath(type: CurvatureBoundaryType | null, x: number, y: number): string {
  const r = MARKER_RADIUS
  switch (type) {
    // Pointing up, like the rise away from a baseline.
    case 'Baseline':
      return polygon([
        [x - TRIANGLE_HALF_BASE * r, y + r],
        [x + TRIANGLE_HALF_BASE * r, y + r],
        [x, y - r],
      ])
    // Pointing down, into the valley between two peaks.
    case 'Valley':
      return polygon([
        [x - TRIANGLE_HALF_BASE * r, y - r],
        [x + TRIANGLE_HALF_BASE * r, y - r],
        [x, y + r],
      ])
    case 'Shoulder':
      return polygon([
        [x - r, y],
        [x, y - DIAMOND_HALF_HEIGHT * r],
        [x + r, y],
        [x, y + DIAMOND_HALF_HEIGHT * r],
      ])
    // A round boundary, and one whose method does not classify boundaries, are both discs.
    case 'Round':
    case null:
      return disc(x, y, type === null ? r * 0.75 : r)
  }
}

/** A path for a disc of radius `r` centred on `(x, y)`. */
export function disc(x: number, y: number, r: number): string {
  return `M${x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`
}

function polygon(points: [number, number][]): string {
  return points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${round(px)},${round(py)}`).join('') + 'Z'
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
