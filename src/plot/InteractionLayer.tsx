import { useState, type PointerEvent } from 'react'
import type { Point } from '../api/types'
import { usePlot } from './plotContext'
import { clampToViewport, pan, zoomBoxOutcome, type MinSpan, type Viewport } from './viewport'

/** What dragging across the plot does. */
export type Mode = 'zoom' | 'pan' | 'addPeak'

// A new peak narrower than this on screen is taken as a slip of the mouse.
const MIN_NEW_PEAK_PIXELS = 4

type Props = {
  mode: Mode
  canAddPeaks: boolean
  view: Viewport
  full: Viewport
  minSpan: MinSpan
  onViewChange: (view: Viewport) => void
  onAddPeak: (low: number, high: number) => void
}

type Drag =
  /** Corners in data units, kept within the view. */
  | { kind: 'zoomBox'; start: Point; end: Point }
  /** Where the drag started in screen pixels, and the view at that moment. */
  | { kind: 'pan'; startX: number; startY: number; startView: Viewport }
  /** The x range dragged across, in data units. */
  | { kind: 'addPeak'; start: number; end: number }

/**
 * Covers the plot area, beneath the data, and turns drags into zooming, panning or adding a
 * peak. Holding Shift pans, and Alt (Option) adds a peak, for one drag whatever the mode.
 * Double-click zooms all the way out.
 */
export function InteractionLayer({ mode, canAddPeaks, view, full, minSpan, onViewChange, onAddPeak }: Props) {
  const { xScale, width, height, pointerToData } = usePlot()
  const [drag, setDrag] = useState<Drag | null>(null)

  const toData = (event: PointerEvent) => clampToViewport(pointerToData(event), view)

  function onPointerDown(event: PointerEvent<SVGRectElement>) {
    if (event.button !== 0) return
    // Keep receiving this pointer's events even once it leaves the plot, until it is released.
    event.currentTarget.setPointerCapture(event.pointerId)

    const dragMode = event.shiftKey ? 'pan' : event.altKey && canAddPeaks ? 'addPeak' : mode
    const point = toData(event)
    switch (dragMode) {
      case 'zoom':
        return setDrag({ kind: 'zoomBox', start: point, end: point })
      case 'pan':
        return setDrag({ kind: 'pan', startX: event.clientX, startY: event.clientY, startView: view })
      case 'addPeak':
        return setDrag({ kind: 'addPeak', start: point.x, end: point.x })
    }
  }

  function onPointerMove(event: PointerEvent<SVGRectElement>) {
    switch (drag?.kind) {
      case 'zoomBox':
        return setDrag({ ...drag, end: toData(event) })
      case 'addPeak':
        return setDrag({ ...drag, end: toData(event).x })
      case 'pan': {
        // Measured from where the drag started, so rounding never accumulates. The data follows
        // the pointer, so the view moves the opposite way in x; y pixels already run downwards.
        const { startView } = drag
        const dx = (-(event.clientX - drag.startX) / width) * (startView.x[1] - startView.x[0])
        const dy = ((event.clientY - drag.startY) / height) * (startView.y[1] - startView.y[0])
        return onViewChange({ x: pan(startView.x, dx, full.x), y: pan(startView.y, dy, full.y) })
      }
    }
  }

  function onPointerUp() {
    if (drag?.kind === 'zoomBox') {
      const outcome = zoomBoxOutcome(drag.start, drag.end, view, minSpan)
      if (outcome.kind === 'zoom') onViewChange(outcome.viewport)
    } else if (drag?.kind === 'addPeak') {
      if (Math.abs(xScale(drag.end) - xScale(drag.start)) >= MIN_NEW_PEAK_PIXELS) {
        onAddPeak(Math.min(drag.start, drag.end), Math.max(drag.start, drag.end))
      }
    }
    setDrag(null)
  }

  const cursorMode = drag?.kind === 'pan' ? 'panning' : mode
  return (
    <g>
      <rect
        className={`interaction-layer interaction-layer--${cursorMode}`}
        width={width}
        height={height}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
        onDoubleClick={() => onViewChange(full)}
      />
      {drag?.kind === 'zoomBox' && <ZoomBox drag={drag} view={view} minSpan={minSpan} />}
      {drag?.kind === 'addPeak' && (
        <rect
          className="new-peak-band"
          x={xScale(Math.min(drag.start, drag.end))}
          width={Math.abs(xScale(drag.end) - xScale(drag.start))}
          height={height}
        />
      )}
    </g>
  )
}

type ZoomBoxProps = {
  drag: { start: Point; end: Point }
  view: Viewport
  minSpan: MinSpan
}

/** The box being dragged, marked when it is too small to zoom to. */
function ZoomBox({ drag: { start, end }, view, minSpan }: ZoomBoxProps) {
  const { xScale, yScale } = usePlot()
  const outcome = zoomBoxOutcome(start, end, view, minSpan)
  if (outcome.kind === 'none') return null

  return (
    <rect
      className={outcome.kind === 'tooSmall' ? 'zoom-box zoom-box--too-small' : 'zoom-box'}
      x={Math.min(xScale(start.x), xScale(end.x))}
      y={Math.min(yScale(start.y), yScale(end.y))}
      width={Math.abs(xScale(end.x) - xScale(start.x))}
      height={Math.abs(yScale(end.y) - yScale(start.y))}
    />
  )
}
