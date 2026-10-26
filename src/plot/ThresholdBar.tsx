import { useState } from 'react'
import { usePlot } from './plotContext'
import type { Scale } from './scale'
import { usePointerDrag } from './usePointerDrag'

export type Threshold = { height: number; start: number; end: number }

type Props = {
  threshold: Threshold
  /** How far the ends can be dragged, such as up to the neighbouring domains; unlimited if left out. */
  limits?: readonly [min: number, max: number]
  /** The −y'' axis's scale, which the threshold's height is on. */
  scale: Scale
  /** Whether to draw the threshold itself, which only means something against −y''. */
  showBar: boolean
  /** Whether to draw the range's ends as lines the height of the plot. */
  showBoundaries: boolean
  /** Drawn more heavily, as when its row in the domain table is hovered. */
  highlighted?: boolean
  /** Shown while the pointer rests on the line. */
  title: string
  onHeightChange: (height: number) => Promise<void>
  onRangeChange: (start: number, end: number) => Promise<void>
  /** Called as the pointer enters and leaves the bar. */
  onHover?: (hovered: boolean) => void
}

// How close to a line, in pixels, still grabs it.
const GRAB_WIDTH = 10
// Half the width of the diamonds marking the threshold's ends, in pixels.
const DIAMOND = 5

/**
 * A curvature threshold and the range it applies over, each drawn when asked for: the threshold as
 * a line at its height on the −y'' axis, with diamonds at its ends, and the range's boundaries as
 * lines the height of the plot. Dragging the line changes the height, and dragging a diamond or a
 * boundary moves that end. The change is sent on release, and everything goes back to the
 * analysis's threshold if it is refused.
 */
export function ThresholdBar({
  threshold: current,
  limits = [-Infinity, Infinity],
  scale,
  showBar,
  showBoundaries,
  highlighted = false,
  title,
  onHeightChange,
  onRangeChange,
  onHover,
}: Props) {
  const { xScale, height, pointerToPixels } = usePlot()

  // The threshold as dragged, held until the analysis comes back with it.
  const [draft, setDraft] = useState<Threshold | null>(null)
  const threshold = draft ?? current

  async function send(change: Promise<void>) {
    await change
    setDraft(null)
  }

  const heightDrag = usePointerDrag({
    // The threshold can't be dragged below zero.
    onMove: (event) => setDraft({ ...threshold, height: Math.max(0, scale.invert(pointerToPixels(event).y)) }),
    onRelease: () => draft && send(onHeightChange(draft.height)),
    onCancel: () => setDraft(null),
  })
  // Each end stops at the other, since the analysis refuses a range that starts where it ends,
  // and at its limit.
  const startDrag = usePointerDrag({
    onMove: (event) => setDraft({ ...threshold, start: clamp(xAt(event), limits[0], threshold.end) }),
    onRelease: () => draft && send(onRangeChange(draft.start, draft.end)),
    onCancel: () => setDraft(null),
  })
  const endDrag = usePointerDrag({
    onMove: (event) => setDraft({ ...threshold, end: clamp(xAt(event), threshold.start, limits[1]) }),
    onRelease: () => draft && send(onRangeChange(draft.start, draft.end)),
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

  const className = [
    'curvature-threshold',
    draft && 'curvature-threshold--dragging',
    highlighted && 'curvature-threshold--highlighted',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <g className={className} onPointerEnter={() => onHover?.(true)} onPointerLeave={() => onHover?.(false)}>
      {showBoundaries && (
        <>
          <line className="curvature-threshold-edge" x1={x0} x2={x0} y1={0} y2={height} />
          <line className="curvature-threshold-edge" x1={x1} x2={x1} y1={0} y2={height} />
          {/* Wider, invisible copies of the boundaries, which take the pointer. */}
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
        </>
      )}
      {showBar && (
        <>
          <line className="curvature-threshold-line" x1={x0} x2={x1} y1={y} y2={y} />
          {/* A wider, invisible copy of the line, which takes the pointer. */}
          <line
            className="curvature-threshold-grab curvature-threshold-grab--line"
            x1={x0}
            x2={x1}
            y1={y}
            y2={y}
            strokeWidth={GRAB_WIDTH}
            {...heightDrag.handlers}
          >
            <title>{title}</title>
          </line>
          {/* The diamonds move the ends too, so the range can be changed with its boundaries hidden. */}
          <path className="curvature-threshold-end" d={diamond(x0)} {...startDrag.handlers} />
          <path className="curvature-threshold-end" d={diamond(x1)} {...endDrag.handlers} />
        </>
      )}
    </g>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
