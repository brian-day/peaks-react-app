import { useState, type PointerEvent } from 'react'

type Callbacks = {
  /** Called for each pointer movement while the drag is under way. */
  onMove: (event: PointerEvent) => void
  /** Called once when the pointer is released. Not called if the drag is cancelled. */
  onRelease: () => void
  /** Called if the browser cancels the drag, for example when a touch turns into a scroll. */
  onCancel?: () => void
}

/**
 * The pointer handlers for dragging one SVG element, and whether it is being dragged.
 *
 * The element captures the pointer, so the drag carries on even when the pointer leaves it.
 * Spread the handlers onto the element: `<line {...handlers} />`.
 */
export function usePointerDrag({ onMove, onRelease, onCancel }: Callbacks) {
  const [dragging, setDragging] = useState(false)

  const handlers = {
    onPointerDown: (event: PointerEvent<SVGElement>) => {
      if (event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    },
    onPointerMove: (event: PointerEvent<SVGElement>) => {
      if (dragging) onMove(event)
    },
    onPointerUp: () => {
      if (!dragging) return
      setDragging(false)
      onRelease()
    },
    onPointerCancel: () => {
      setDragging(false)
      onCancel?.()
    },
  }

  return { dragging, handlers }
}
