// The maths of zooming and panning, kept free of React and the DOM so it can be tested directly.

import type { Point, XY } from '../api/types'

/** A visible range on one axis, as `[min, max]` in data units. */
export type Domain = readonly [min: number, max: number]

/** The region of data the plot shows. */
export type Viewport = { x: Domain; y: Domain }

/** The narrowest span the plot will zoom to on each axis, in data units. */
export type MinSpan = { x: number; y: number }

// How much one mouse-wheel notch zooms in and out, as in the Mathematica preview.
const WHEEL_ZOOM_IN_FACTOR = 1.1
const WHEEL_ZOOM_OUT_FACTOR = 1.2

// A zoom box smaller than this fraction of the view is taken as a slip of the mouse.
const MIN_DRAG_FRACTION = 0.03

// Room below the trace, so a baseline handle on the lowest point stays grabbable, and above it,
// so labels at the tallest apex are not clipped.
const BOTTOM_MARGIN_FRACTION = 0.02
const TOP_MARGIN_FRACTION = 0.05

/** The fully zoomed-out view of a trace, and how far into it the plot may zoom. */
export function traceBounds(trace: readonly XY[]): { full: Viewport; minSpan: MinSpan } {
  let [xMin, xMax, yMin, yMax] = [Infinity, -Infinity, Infinity, -Infinity]
  for (const [x, y] of trace) {
    xMin = Math.min(xMin, x)
    xMax = Math.max(xMax, x)
    yMin = Math.min(yMin, y)
    yMax = Math.max(yMax, y)
  }
  const ySpan = yMax - yMin

  return {
    full: {
      x: [xMin, xMax],
      y: [yMin - BOTTOM_MARGIN_FRACTION * ySpan, yMax + TOP_MARGIN_FRACTION * ySpan],
    },
    // As in the Mathematica preview: 0.01 data units across, and 1/10000 of the trace's height.
    minSpan: { x: 0.01, y: ySpan / 10000 },
  }
}

/** Shifts a domain by `delta`, stopping at the edges of `full`. */
export function pan(domain: Domain, delta: number, full: Domain): Domain {
  const [min, max] = domain
  if (min + delta <= full[0]) return [full[0], full[0] + (max - min)]
  if (max + delta >= full[1]) return [full[1] - (max - min), full[1]]
  return [min + delta, max + delta]
}

/** Moves a domain back inside `full` without changing its span, or returns `full` if wider. */
export function fitWithin(domain: Domain, full: Domain): Domain {
  const [min, max] = domain
  if (max - min >= full[1] - full[0]) return full
  if (min < full[0]) return [full[0], max + (full[0] - min)]
  if (max > full[1]) return [min - (max - full[1]), full[1]]
  return domain
}

/**
 * Scales a domain's span by `spanScale` (below 1 zooms in) while keeping `anchor` where it is on
 * screen. Leaves the domain alone rather than zoom in past `minSpan`.
 */
export function zoomAbout(
  domain: Domain,
  anchor: number,
  spanScale: number,
  full: Domain,
  minSpan: number,
): Domain {
  const [min, max] = domain
  if ((max - min) * spanScale < minSpan) return domain
  return fitWithin([anchor + (min - anchor) * spanScale, anchor + (max - anchor) * spanScale], full)
}

/** The region of data the plot shows, with the −y'' axis's range while that axis is shown. */
export type PlotView = Viewport & { y2: Domain | null }

/** How far the −y'' axis may zoom out, and in. */
export type SecondaryAxis = { full: Domain; minSpan: number }

/**
 * Where `other` goes when `before` changes to `after`, moved by the same fraction of its own span.
 *
 * This is how −y'' follows the trace's y: zooming to the middle fifth of one zooms to the middle
 * fifth of the other, whatever their units.
 */
export function followProportionally(before: Domain, after: Domain, other: Domain): Domain {
  const scale = (other[1] - other[0]) / (before[1] - before[0])
  return [other[0] + (after[0] - before[0]) * scale, other[1] + (after[1] - before[1]) * scale]
}

/**
 * Zooms the view for a scroll of `notches` (positive scrolls down, zooming out) with the pointer
 * at `fraction` of the way across the plot area, measured from its bottom-left corner.
 *
 * Inside the plot area every axis zooms, −y'' along with y. Over an axis only that axis does:
 * left of the plot area (the y axis) only y, below it (the x axis) only x, and right of it (the
 * −y'' axis, when shown) only −y''.
 */
export function wheelZoom(
  view: PlotView,
  fraction: { x: number; y: number },
  notches: number,
  full: Viewport,
  minSpan: MinSpan,
  secondary: SecondaryAxis | null,
): PlotView {
  const spanScale = notches < 0 ? WHEEL_ZOOM_IN_FACTOR ** notches : WHEEL_ZOOM_OUT_FACTOR ** notches
  const zoom = (domain: Domain, at: number, fullDomain: Domain, min: number) =>
    zoomAbout(domain, domain[0] + at * (domain[1] - domain[0]), spanScale, fullDomain, min)

  // −y'' not yet moved by the user spans its whole curve.
  const y2Before = view.y2 ?? secondary?.full ?? null

  if (fraction.x > 1 && y2Before && secondary) {
    return { ...view, y2: zoom(y2Before, fraction.y, secondary.full, secondary.minSpan) }
  }

  const x = fraction.x >= 0 ? zoom(view.x, fraction.x, full.x, minSpan.x) : view.x
  const y = fraction.y >= 0 ? zoom(view.y, fraction.y, full.y, minSpan.y) : view.y
  const insidePlot = fraction.x >= 0 && fraction.y >= 0
  return { x, y, y2: y2Before && insidePlot ? followProportionally(view.y, y, y2Before) : y2Before }
}

// Room above and below a curve fitted to the view, so its extremes are not drawn on the edges.
const FIT_MARGIN_FRACTION = 0.05

/**
 * The y range of the points whose x is within `x`, with a margin above and below; `null` if none
 * are. The points must be in increasing order of x, as a trace is.
 */
export function fitToVisible(points: readonly XY[], x: Domain): Domain | null {
  // The first point at or after the view's left edge, found by bisection: curves are long, and
  // this runs on every frame of a pan.
  let low = 0
  let high = points.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (points[mid][0] < x[0]) low = mid + 1
    else high = mid
  }

  let yMin = Infinity
  let yMax = -Infinity
  for (let i = low; i < points.length && points[i][0] <= x[1]; i++) {
    yMin = Math.min(yMin, points[i][1])
    yMax = Math.max(yMax, points[i][1])
  }
  if (yMin > yMax) return null

  // A flat stretch still gets some height, so it draws as a line rather than nothing.
  const margin = (yMax - yMin) * FIT_MARGIN_FRACTION || Math.abs(yMax) * FIT_MARGIN_FRACTION || 1
  return [yMin - margin, yMax + margin]
}

/** Moves a point onto the nearest edge of the view if it lies outside it. */
export function clampToViewport(point: Point, view: Viewport): Point {
  return {
    x: Math.min(Math.max(point.x, view.x[0]), view.x[1]),
    y: Math.min(Math.max(point.y, view.y[0]), view.y[1]),
  }
}

export type ZoomBoxOutcome =
  /** The drag was too short to mean anything. */
  | { kind: 'none' }
  /** The box is narrower than the plot will zoom to. */
  | { kind: 'tooSmall' }
  | { kind: 'zoom'; viewport: Viewport }

/** What releasing a zoom box dragged from `start` to `end` within `view` would do. */
export function zoomBoxOutcome(start: Point, end: Point, view: Viewport, minSpan: MinSpan): ZoomBoxOutcome {
  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)

  const dragFraction = Math.hypot(width / (view.x[1] - view.x[0]), height / (view.y[1] - view.y[0]))
  if (dragFraction < MIN_DRAG_FRACTION) return { kind: 'none' }
  if (width < minSpan.x || height < minSpan.y) return { kind: 'tooSmall' }

  return {
    kind: 'zoom',
    viewport: {
      x: [Math.min(start.x, end.x), Math.max(start.x, end.x)],
      y: [Math.min(start.y, end.y), Math.max(start.y, end.y)],
    },
  }
}
