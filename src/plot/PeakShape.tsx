import { useMemo, useState } from 'react'
import type { CurvatureBoundaryType, PeakView, Point } from '../api/types'
import { boundaryMarkerPath, disc, HANDLE_RADIUS, MARKER_RADIUS } from './markers'
import { usePlot } from './plotContext'
import { dataPath, dataTransform } from './scale'
import { usePointerDrag } from './usePointerDrag'

type Props = {
  peak: PeakView
  /** Drawn more strongly, as the peak under the pointer is. */
  highlighted: boolean
  /** Sends a manual peak's new boundary points, resolving once the analysis has been updated. */
  onMoveBoundaries: (peakId: number, low: Point, high: Point) => Promise<void>
}

/**
 * One peak: its area above the baseline, the baseline itself, a marker at its apex, and its
 * boundary points, each marked by how that end meets its neighbour, or dragged when the peak is
 * editable.
 */
export function PeakShape({ peak, highlighted, onMoveBoundaries }: Props) {
  const { xScale, yScale } = usePlot()

  // Both ends as they will be once a boundary drag is sent, held until the analysis comes back.
  const [draft, setDraft] = useState<{ low: Point; high: Point } | null>(null)
  const low = draft?.low ?? peak.low.point
  const high = draft?.high ?? peak.high.point

  // Envelope from the low end to the high end, closed back along the baseline, in data coordinates.
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
      <path className="peak-apex" d={disc(xScale(peak.apex.x), yScale(peak.apex.y), MARKER_RADIUS)} />
      {editableId === null ? (
        <>
          <BoundaryMarker type={peak.low.integrationType} x={xScale(low.x)} y={yScale(low.y)} />
          <BoundaryMarker type={peak.high.integrationType} x={xScale(high.x)} y={yScale(high.y)} />
        </>
      ) : (
        <>
          <BoundaryHandle point={low} onMove={(point) => moveEnd('low', point)} onRelease={() => void release()} />
          <BoundaryHandle point={high} onMove={(point) => moveEnd('high', point)} onRelease={() => void release()} />
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

const BOUNDARY_NAMES: Record<CurvatureBoundaryType, string> = {
  Baseline: 'Baseline boundary',
  Valley: 'Valley boundary',
  Shoulder: 'Shoulder boundary',
  Round: 'Round boundary',
}

type MarkerProps = {
  type: CurvatureBoundaryType | null
  x: number
  y: number
}

/** A boundary drawn in the shape of its integration type, named on hover. */
function BoundaryMarker({ type, x, y }: MarkerProps) {
  return (
    <path className="peak-boundary" d={boundaryMarkerPath(type, x, y)}>
      {type && <title>{BOUNDARY_NAMES[type]}</title>}
    </path>
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
  const { dragging, handlers } = usePointerDrag({ onMove: (event) => onMove(pointerToData(event)), onRelease })

  return (
    <circle
      className={dragging ? 'peak-handle peak-handle--dragging' : 'peak-handle'}
      cx={xScale(point.x)}
      cy={yScale(point.y)}
      r={HANDLE_RADIUS}
      {...handlers}
    />
  )
}
