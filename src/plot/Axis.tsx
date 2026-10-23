import type { Scale } from './scale'

const TICK_COUNT = 8
const TICK_LENGTH = 6

type Props = {
  orientation: 'bottom' | 'left' | 'right'
  scale: Scale
  /**
   * Where the axis line sits across the plot area, in pixels: the plot height for a bottom axis,
   * 0 for a left axis, the plot width for a right one.
   */
  position: number
  /** How far the label sits from the axis line, outside the plot area, in pixels. */
  labelDistance: number
  label: string
}

/** An axis line with ticks and a label, drawn along an edge of the plot area. */
export function Axis({ orientation, scale, position, labelDistance, label }: Props) {
  const format = scale.tickFormat(TICK_COUNT)
  const [start, end] = scale.range()
  const middle = (start + end) / 2

  if (orientation === 'bottom') {
    return (
      <g className="axis" transform={`translate(0,${position})`}>
        <line x1={start} x2={end} />
        {scale.ticks(TICK_COUNT).map((tick) => (
          <g key={tick} transform={`translate(${scale(tick)},0)`}>
            <line y2={TICK_LENGTH} />
            <text y={TICK_LENGTH + 12} textAnchor="middle">
              {format(tick)}
            </text>
          </g>
        ))}
        <text className="axis-label" x={middle} y={labelDistance} textAnchor="middle">
          {label}
        </text>
      </g>
    )
  }

  // A vertical axis: ticks and label point away from the plot area, left or right.
  const outward = orientation === 'left' ? -1 : 1
  return (
    <g className="axis" transform={`translate(${position},0)`}>
      <line y1={start} y2={end} />
      {scale.ticks(TICK_COUNT).map((tick) => (
        <g key={tick} transform={`translate(0,${scale(tick)})`}>
          <line x2={outward * TICK_LENGTH} />
          <text x={outward * (TICK_LENGTH + 4)} dy="0.32em" textAnchor={outward < 0 ? 'end' : 'start'}>
            {format(tick)}
          </text>
        </g>
      ))}
      <text
        className="axis-label"
        transform={`translate(${outward * labelDistance},${middle}) rotate(${outward * 90})`}
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  )
}
