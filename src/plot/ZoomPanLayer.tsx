import { useState, type PointerEvent } from 'react'
import type { Point } from '../api/types'
import type { Scale } from './scale'
import { clampToViewport, pan, zoomBoxOutcome, type MinSpan, type Viewport } from './viewport'

type Props = {
  view: Viewport
  full: Viewport
  minSpan: MinSpan
  xScale: Scale
  yScale: Scale
  /** The plot area's size in pixels. */
  width: number
  height: number
  onViewChange: (view: Viewport) => void
}

type Drag =
  /** Corners in data units, kept within the view. */
  | { kind: 'zoomBox'; start: Point; end: Point }
  /** Where the drag started in screen pixels, and the view at that moment. */
  | { kind: 'pan'; startX: number; startY: number; startView: Viewport }

/**
 * Covers the plot area and turns drags into zooming and panning: drag a box to zoom to it,
 * Shift-drag to pan, and double-click to zoom all the way out.
 */
export function ZoomPanLayer({ view, full, minSpan, xScale, yScale, width, height, onViewChange }: Props) {
  const [drag, setDrag] = useState<Drag | null>(null)

  function toData(event: PointerEvent<SVGRectElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect()
    return clampToViewport(
      { x: xScale.invert(event.clientX - bounds.left), y: yScale.invert(event.clientY - bounds.top) },
      view,
    )
  }

  function onPointerDown(event: PointerEvent<SVGRectElement>) {
    if (event.button !== 0) return
    // Keep receiving this pointer's events even once it leaves the plot, until it is released.
    event.currentTarget.setPointerCapture(event.pointerId)

    if (event.shiftKey) {
      setDrag({ kind: 'pan', startX: event.clientX, startY: event.clientY, startView: view })
    } else {
      const point = toData(event)
      setDrag({ kind: 'zoomBox', start: point, end: point })
    }
  }

  function onPointerMove(event: PointerEvent<SVGRectElement>) {
    if (drag?.kind === 'zoomBox') {
      setDrag({ ...drag, end: toData(event) })
    } else if (drag?.kind === 'pan') {
      // Measured from where the drag started, so rounding never accumulates. The data follows
      // the pointer, so the view moves the opposite way in x; y pixels already run downwards.
      const { startView } = drag
      const dx = (-(event.clientX - drag.startX) / width) * (startView.x[1] - startView.x[0])
      const dy = ((event.clientY - drag.startY) / height) * (startView.y[1] - startView.y[0])
      onViewChange({ x: pan(startView.x, dx, full.x), y: pan(startView.y, dy, full.y) })
    }
  }

  function onPointerUp() {
    if (drag?.kind === 'zoomBox') {
      const outcome = zoomBoxOutcome(drag.start, drag.end, view, minSpan)
      if (outcome.kind === 'zoom') onViewChange(outcome.viewport)
    }
    setDrag(null)
  }

  return (
    <g>
      <rect
        className={drag?.kind === 'pan' ? 'zoom-pan-layer zoom-pan-layer--panning' : 'zoom-pan-layer'}
        width={width}
        height={height}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
        onDoubleClick={() => onViewChange(full)}
      />
      {drag?.kind === 'zoomBox' && (
        <ZoomBox drag={drag} view={view} minSpan={minSpan} xScale={xScale} yScale={yScale} />
      )}
    </g>
  )
}

type ZoomBoxProps = {
  drag: { start: Point; end: Point }
  view: Viewport
  minSpan: MinSpan
  xScale: Scale
  yScale: Scale
}

/** The box being dragged, marked when it is too small to zoom to. */
function ZoomBox({ drag: { start, end }, view, minSpan, xScale, yScale }: ZoomBoxProps) {
  const outcome = zoomBoxOutcome(start, end, view, minSpan)
  if (outcome.kind === 'none') return null

  const x = Math.min(xScale(start.x), xScale(end.x))
  const y = Math.min(yScale(start.y), yScale(end.y))
  return (
    <rect
      className={outcome.kind === 'tooSmall' ? 'zoom-box zoom-box--too-small' : 'zoom-box'}
      x={x}
      y={y}
      width={Math.abs(xScale(end.x) - xScale(start.x))}
      height={Math.abs(yScale(end.y) - yScale(start.y))}
    />
  )
}
