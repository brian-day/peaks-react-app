import type { ScaleLinear } from 'd3-scale'
import type { XY } from '../api/types'

/** Maps data coordinates on one axis to pixels within the plot area. */
export type Scale = ScaleLinear<number, number>

/**
 * An SVG path through the given points, in data coordinates.
 *
 * Draw it with a {@link dataTransform} rather than rebuilding it in pixels whenever the view
 * changes: building a long path string is what makes panning slow, while transforming one is
 * nearly free.
 */
export function dataPath(points: readonly XY[]): string {
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join('')
}

/** An SVG transform taking data coordinates to the pixels the scales map them to. */
export function dataTransform(xScale: Scale, yScale: Scale): string {
  const [ax, bx] = coefficients(xScale)
  const [ay, by] = coefficients(yScale)
  return `matrix(${ax},0,0,${ay},${bx},${by})`
}

/** The `a` and `b` for which the scale maps `v` to `a * v + b`. */
function coefficients(scale: Scale): [number, number] {
  const [d0, d1] = scale.domain()
  const [r0, r1] = scale.range()
  const a = (r1 - r0) / (d1 - d0)
  return [a, r0 - a * d0]
}
