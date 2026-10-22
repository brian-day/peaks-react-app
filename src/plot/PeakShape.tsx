import type { PeakView } from '../api/types'
import { linePath, type Scale } from './scale'

type Props = {
  peak: PeakView
  xScale: Scale
  yScale: Scale
}

/** One peak: its area above the baseline, the baseline itself, and its boundary points. */
export function PeakShape({ peak, xScale, yScale }: Props) {
  const { low, high } = peak

  // Envelope from the low end to the high end, closed back along the baseline.
  const area =
    linePath([[low.point.x, low.point.y], ...peak.envelope, [high.point.x, high.point.y]], xScale, yScale) +
    'Z'

  const classes = ['peak']
  if (peak.excluded) classes.push('peak--excluded')
  if (!peak.expected) classes.push('peak--unexpected')
  if (peak.isParent) classes.push('peak--parent')

  return (
    <g className={classes.join(' ')}>
      <path className="peak-area" d={area} />
      <line
        className="peak-baseline"
        x1={xScale(low.point.x)}
        y1={yScale(low.point.y)}
        x2={xScale(high.point.x)}
        y2={yScale(high.point.y)}
      />
      <circle className="peak-boundary" cx={xScale(low.point.x)} cy={yScale(low.point.y)} r={3} />
      <circle className="peak-boundary" cx={xScale(high.point.x)} cy={yScale(high.point.y)} r={3} />
      {peak.label !== '' && (
        <text className="peak-label" x={xScale(peak.apex.x)} y={yScale(peak.apex.y) - 6} textAnchor="middle">
          {peak.label}
        </text>
      )}
    </g>
  )
}
