import type { Scale } from './scale'

const TICK_COUNT = 8
const TICK_LENGTH = 6

type Props = {
  orientation: 'bottom' | 'left'
  scale: Scale
  /** The length of the other axis, so a bottom axis can sit below the plot area. */
  offset: number
  label: string
}

/** An axis line with ticks and a label, drawn along the bottom or left of the plot area. */
export function Axis({ orientation, scale, offset, label }: Props) {
  const format = scale.tickFormat(TICK_COUNT)
  const [start, end] = scale.range()

  if (orientation === 'bottom') {
    return (
      <g className="axis" transform={`translate(0,${offset})`}>
        <line x1={start} x2={end} />
        {scale.ticks(TICK_COUNT).map((tick) => (
          <g key={tick} transform={`translate(${scale(tick)},0)`}>
            <line y2={TICK_LENGTH} />
            <text y={TICK_LENGTH + 12} textAnchor="middle">
              {format(tick)}
            </text>
          </g>
        ))}
        <text className="axis-label" x={(start + end) / 2} y={TICK_LENGTH + 32} textAnchor="middle">
          {label}
        </text>
      </g>
    )
  }

  return (
    <g className="axis">
      <line y1={start} y2={end} />
      {scale.ticks(TICK_COUNT).map((tick) => (
        <g key={tick} transform={`translate(0,${scale(tick)})`}>
          <line x2={-TICK_LENGTH} />
          <text x={-TICK_LENGTH - 4} dy="0.32em" textAnchor="end">
            {format(tick)}
          </text>
        </g>
      ))}
      <text
        className="axis-label"
        transform={`translate(${-offset},${(start + end) / 2}) rotate(-90)`}
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  )
}
