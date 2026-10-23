import { useState, type PointerEvent } from 'react'
import type { Command, CurvatureSettings } from '../api/types'
import { usePlot } from './plotContext'
import type { Scale } from './scale'
import { usePointerDrag } from './usePointerDrag'

type Props = {
  settings: CurvatureSettings
  /** The −y'' axis's scale, which the threshold's height is on. */
  scale: Scale
  onCommand: (command: Command) => Promise<void>
}

type Threshold = { height: number; start: number; end: number }

// How close to a line, in pixels, still grabs it.
const GRAB_WIDTH = 10
// Half the width of the diamonds marking the threshold's ends, in pixels.
const DIAMOND = 5

/**
 * The curvature method's threshold, drawn on the −y'' axis: a line at its height across the
 * range it applies over, with that range's ends marked. Dragging the line changes the height,
 * and dragging either end moves it. The change is sent on release, and the bar goes back to the
 * analysis's threshold if it is refused.
 */
export function ThresholdBar({ settings, scale, onCommand }: Props) {
  const { xScale, height, pointerToPixels } = usePlot()

  // The threshold as dragged, held until the analysis comes back with it.
  const [draft, setDraft] = useState<Threshold | null>(null)
  const threshold = draft ?? {
    height: settings.thresholdHeight,
    start: settings.thresholdStart,
    end: settings.thresholdEnd,
  }

  async function send(command: Command) {
    await onCommand(command)
    setDraft(null)
  }

  const heightDrag = usePointerDrag({
    // As in the Mathematica preview, the threshold cannot be dragged below zero.
    onMove: (event) => setDraft({ ...threshold, height: Math.max(0, scale.invert(pointerToPixels(event).y)) }),
    onRelease: () => draft && send({ kind: 'setThresholdHeight', value: draft.height }),
    onCancel: () => setDraft(null),
  })
  // Each end stops at the other; the analysis refuses a range that starts where it ends.
  const startDrag = usePointerDrag({
    onMove: (event) => setDraft({ ...threshold, start: Math.min(xAt(event), threshold.end) }),
    onRelease: () => draft && send({ kind: 'setThresholdDomain', start: draft.start, end: draft.end }),
    onCancel: () => setDraft(null),
  })
  const endDrag = usePointerDrag({
    onMove: (event) => setDraft({ ...threshold, end: Math.max(xAt(event), threshold.start) }),
    onRelease: () => draft && send({ kind: 'setThresholdDomain', start: draft.start, end: draft.end }),
    onCancel: () => setDraft(null),
  })

  function xAt(event: PointerEvent) {
    return xScale.invert(pointerToPixels(event).x)
  }

  const y = scale(threshold.height)
  const x0 = xScale(threshold.start)
  const x1 = xScale(threshold.end)
  const diamond = (x: number) =>
    `M${x - DIAMOND},${y}L${x},${y - DIAMOND}L${x + DIAMOND},${y}L${x},${y + DIAMOND}Z`

  return (
    <g className={draft ? 'curvature-threshold curvature-threshold--dragging' : 'curvature-threshold'}>
      <line className="curvature-threshold-edge" x1={x0} x2={x0} y1={0} y2={height} />
      <line className="curvature-threshold-edge" x1={x1} x2={x1} y1={0} y2={height} />
      <line className="curvature-threshold-line" x1={x0} x2={x1} y1={y} y2={y} />
      <path className="curvature-threshold-end" d={diamond(x0) + diamond(x1)} />

      {/* Wider, invisible copies of the lines, which take the pointer. */}
      <line
        className="curvature-threshold-grab curvature-threshold-grab--edge"
        x1={x0}
        x2={x0}
        y1={0}
        y2={height}
        strokeWidth={GRAB_WIDTH}
        {...startDrag.handlers}
      />
      <line
        className="curvature-threshold-grab curvature-threshold-grab--edge"
        x1={x1}
        x2={x1}
        y1={0}
        y2={height}
        strokeWidth={GRAB_WIDTH}
        {...endDrag.handlers}
      />
      <line
        className="curvature-threshold-grab curvature-threshold-grab--line"
        x1={x0}
        x2={x1}
        y1={y}
        y2={y}
        strokeWidth={GRAB_WIDTH}
        {...heightDrag.handlers}
      >
        <title>Drag to change the curvature threshold</title>
      </line>
    </g>
  )
}
