import { useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Point } from '../api/types'
import { usePlot } from './plotContext'
import { useWindowDrag } from './usePointerDrag'
import { clampToViewport, pan, zoomBoxOutcome, type MinSpan, type Viewport } from './viewport'

/** What dragging across the plot does. */
export type Mode = 'zoom' | 'pan' | AddMode

/** The modes that drag out an x range to add something over. */
export type AddMode = 'addPeak' | 'addDomain'

// A new peak or domain narrower than this on screen is taken as a slip of the mouse.
const MIN_NEW_RANGE_PIXELS = 4

type Props = {
  mode: Mode
  /** What holding Alt (Option) drags out, if anything can be added under the method. */
  altMode: AddMode | null
  view: Viewport
  full: Viewport
  minSpan: MinSpan
  onViewChange: (view: Viewport) => void
  /** Zooms all the way out; double-clicking does this. */
  onResetView: () => void
  onAddPeak: (low: number, high: number) => void
  onAddDomain: (start: number, end: number) => void
  /** Where the pointer is over the plot, in data coordinates, or `null` once it is not. */
  onHover: (point: Point | null) => void
}

type Drag =
  /** Corners in data units, kept within the view. */
  | { kind: 'zoomBox'; start: Point; end: Point }
  /** Where the drag started in screen pixels, and the view at that moment. */
  | { kind: 'pan'; startX: number; startY: number; startView: Viewport }
  /** The x range dragged across, in data units, and what it adds. */
  | { kind: 'add'; adds: AddMode; start: number; end: number }

/**
 * Covers the plot area, beneath the data, and turns drags into zooming, panning or adding a
 * peak or domain. Holding Shift pans, and Alt (Option) adds whatever the method can add, for one
 * drag whatever the mode.
 * Double-click zooms all the way out.
 */
export function InteractionLayer({
  mode,
  altMode,
  view,
  full,
  minSpan,
  onViewChange,
  onResetView,
  onAddPeak,
  onAddDomain,
  onHover,
}: Props) {
  const { xScale, width, height, pointerToData } = usePlot()
  const [drag, setDrag] = useState<Drag | null>(null)

  const toData = (event: { clientX: number; clientY: number }) => clampToViewport(pointerToData(event), view)

  function onPointerDown(event: ReactPointerEvent<SVGRectElement>) {
    if (event.button !== 0) return
    // Whatever was under the pointer is not what a drag is about.
    onHover(null)
    // Keeps other elements from reacting to the pointer passing over them mid-drag.
    event.currentTarget.setPointerCapture(event.pointerId)

    const dragMode = event.shiftKey ? 'pan' : event.altKey && altMode ? altMode : mode
    const point = toData(event)
    switch (dragMode) {
      case 'zoom':
        return setDrag({ kind: 'zoomBox', start: point, end: point })
      case 'pan':
        return setDrag({ kind: 'pan', startX: event.clientX, startY: event.clientY, startView: view })
      case 'addPeak':
      case 'addDomain':
        return setDrag({ kind: 'add', adds: dragMode, start: point.x, end: point.x })
    }
  }

  // Followed across the whole window, so a drag carries on, and ends, wherever the pointer is
  // released; see useWindowDrag.
  useWindowDrag(drag !== null, { onMove: onDragMove, onRelease: onDragEnd, onCancel: () => setDrag(null) })

  function onDragMove(event: PointerEvent) {
    switch (drag?.kind) {
      case 'zoomBox':
        return setDrag({ ...drag, end: toData(event) })
      case 'add':
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

  function onDragEnd() {
    if (drag?.kind === 'zoomBox') {
      const outcome = zoomBoxOutcome(drag.start, drag.end, view, minSpan)
      if (outcome.kind === 'zoom') onViewChange(outcome.viewport)
    } else if (drag?.kind === 'add') {
      if (Math.abs(xScale(drag.end) - xScale(drag.start)) >= MIN_NEW_RANGE_PIXELS) {
        const add = drag.adds === 'addPeak' ? onAddPeak : onAddDomain
        add(Math.min(drag.start, drag.end), Math.max(drag.start, drag.end))
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
        onPointerMove={(event) => {
          if (!drag) onHover(pointerToData(event))
        }}
        onPointerLeave={() => onHover(null)}
        onDoubleClick={onResetView}
      />
      {drag?.kind === 'zoomBox' && <ZoomBox drag={drag} view={view} minSpan={minSpan} />}
      {drag?.kind === 'add' && (
        <rect
          className={drag.adds === 'addPeak' ? 'new-peak-band' : 'new-domain-band'}
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
