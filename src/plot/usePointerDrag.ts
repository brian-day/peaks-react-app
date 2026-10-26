import { useEffect, useEffectEvent, useState, type PointerEvent as ReactPointerEvent } from 'react'

type Callbacks = {
  /** Called for each pointer movement while the drag is under way. */
  onMove: (event: PointerEvent) => void
  /** Called once when the pointer is released. Not called if the drag is cancelled. */
  onRelease: () => void
  /** Called if the browser cancels the drag, for example when a touch turns into a scroll. */
  onCancel?: () => void
}

/**
 * Follows the pointer across the whole window while `active`, for a drag that began on an element,
 * until it is released anywhere, outside the plot or the window included.
 *
 * Capturing the pointer on the element isn't enough on its own: released outside the plot, Chrome
 * often takes the capture back before the release, or even while the button is still down, and
 * sends the release to whatever is under the pointer. The window hears it either way.
 */
export function useWindowDrag(active: boolean, { onMove, onRelease, onCancel }: Callbacks) {
  // Effect events always call the latest callbacks, so the listeners needn't be re-added each render.
  const move = useEffectEvent(onMove)
  const release = useEffectEvent(onRelease)
  const cancel = useEffectEvent(() => onCancel?.())

  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    const options = { signal: controller.signal }
    window.addEventListener('pointermove', (event) => move(event), options)
    window.addEventListener('pointerup', () => release(), options)
    window.addEventListener('pointercancel', () => cancel(), options)
    return () => controller.abort()
  }, [active])
}

/**
 * The pointer handlers for dragging one SVG element, and whether it is being dragged.
 *
 * The drag starts on the element and is followed across the whole window; see {@link useWindowDrag}.
 * Spread the handlers onto the element: `<line {...handlers} />`.
 */
export function usePointerDrag({ onMove, onRelease, onCancel }: Callbacks) {
  const [dragging, setDragging] = useState(false)

  useWindowDrag(dragging, {
    onMove,
    onRelease: () => {
      setDragging(false)
      onRelease()
    },
    onCancel: () => {
      setDragging(false)
      onCancel?.()
    },
  })

  const handlers = {
    onPointerDown: (event: ReactPointerEvent<SVGElement>) => {
      if (event.button !== 0) return
      // Keeps other elements from reacting to the pointer passing over them mid-drag.
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    },
  }

  return { dragging, handlers }
}
