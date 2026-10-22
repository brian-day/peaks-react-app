import type { ScaleLinear } from 'd3-scale'
import type { XY } from '../api/types'

/** Maps data coordinates on one axis to pixels within the plot area. */
export type Scale = ScaleLinear<number, number>

/** An SVG path through the given data points, in pixels. */
export function linePath(points: readonly XY[], xScale: Scale, yScale: Scale): string {
  return points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${xScale(x)},${yScale(y)}`)
    .join('')
}
