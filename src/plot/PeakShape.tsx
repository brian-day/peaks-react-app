import { useMemo, useState, type PointerEvent } from 'react'
import type { PeakView, Point } from '../api/types'
import { usePlot } from './plotContext'
import { dataPath, dataTransform } from './scale'

type Props = {
  peak: PeakView
  /** Drawn more strongly, as the peak under the pointer is. */
  highlighted: boolean
  /** Sends a manual peak's new boundary points, resolving once the analysis has been updated. */
  onMoveBoundaries: (peakId: number, low: Point, high: Point) => Promise<void>
}

/**
 * One peak: its area above the baseline, the baseline itself, and its boundary points, which can
 * be dragged when the peak is editable.
 */
export function PeakShape({ peak, highlighted, onMoveBoundaries }: Props) {
  const { xScale, yScale } = usePlot()

  // Both ends as they will be once a boundary drag is sent, held until the analysis comes back.
  const [draft, setDraft] = useState<{ low: Point; high: Point } | null>(null)
  const low = draft?.low ?? peak.low.point
  const high = draft?.high ?? peak.high.point

  // Envelope from the low end to the high end, closed back along the baseline. Built in data
  // coordinates once per peak, like the trace, since an envelope can have thousands of points.
  // It follows the analysis, not the draft: only the server can say where the new envelope runs.
  const area = useMemo(
    () => dataPath([[peak.low.point.x, peak.low.point.y], ...peak.envelope, [peak.high.point.x, peak.high.point.y]]) + 'Z',
    [peak.low.point, peak.high.point, peak.envelope],
  )

  // Only peaks the user drew carry a plain peak ID; threshold peaks are found, not drawn.
  const editableId = peak.editable && peak.id.kind === 'Peak' ? peak.id.value : null

  function moveEnd(end: 'low' | 'high', point: Point) {
    setDraft((current) => ({ low, high, ...current, [end]: point }))
  }

  async function release() {
    if (draft && editableId !== null) {
      await onMoveBoundaries(editableId, draft.low, draft.high)
    }
    setDraft(null)
  }

  const classes = ['peak']
  if (peak.excluded) classes.push('peak--excluded')
  if (!peak.expected) classes.push('peak--unexpected')
  if (peak.isParent) classes.push('peak--parent')
  if (highlighted) classes.push('peak--highlighted')

  return (
    <g className={classes.join(' ')}>
      <path className="peak-area" d={area} transform={dataTransform(xScale, yScale)} />
      <line
        className="peak-baseline"
        x1={xScale(low.x)}
        y1={yScale(low.y)}
        x2={xScale(high.x)}
        y2={yScale(high.y)}
      />
      {editableId === null ? (
        <>
          <circle className="peak-boundary" cx={xScale(low.x)} cy={yScale(low.y)} r={3} />
          <circle className="peak-boundary" cx={xScale(high.x)} cy={yScale(high.y)} r={3} />
        </>
      ) : (
        <>
          <BoundaryHandle point={low} onMove={(point) => moveEnd('low', point)} onRelease={release} />
          <BoundaryHandle point={high} onMove={(point) => moveEnd('high', point)} onRelease={release} />
        </>
      )}
      {peak.label !== '' && (
        <text className="peak-label" x={xScale(peak.apex.x)} y={yScale(peak.apex.y) - 6} textAnchor="middle">
          {peak.label}
        </text>
      )}
    </g>
  )
}

type HandleProps = {
  point: Point
  onMove: (point: Point) => void
  onRelease: () => void
}

/** A boundary point that follows the pointer while dragged, off the trace if need be. */
function BoundaryHandle({ point, onMove, onRelease }: HandleProps) {
  const { xScale, yScale, pointerToData } = usePlot()
  const [dragging, setDragging] = useState(false)

  return (
    <circle
      className={dragging ? 'peak-handle peak-handle--dragging' : 'peak-handle'}
      cx={xScale(point.x)}
      cy={yScale(point.y)}
      r={5}
      onPointerDown={(event: PointerEvent<SVGCircleElement>) => {
        if (event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        setDragging(true)
      }}
      onPointerMove={(event) => {
        if (dragging) onMove(pointerToData(event))
      }}
      onPointerUp={() => {
        if (!dragging) return
        setDragging(false)
        onRelease()
      }}
      onPointerCancel={() => setDragging(false)}
    />
  )
}
