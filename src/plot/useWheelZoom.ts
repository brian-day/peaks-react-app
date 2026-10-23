import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react'
import { wheelZoom, type MinSpan, type Viewport } from './viewport'

// Browsers report a mouse-wheel notch as about 100 pixels, or as 3 lines.
const PIXELS_PER_NOTCH = 100
const LINES_PER_NOTCH = 3

type PlotArea = { left: number; top: number; width: number; height: number }

/**
 * Zooms the view as the user scrolls over `ref`'s element, around the pointer.
 *
 * The zoom is in proportion to how far the user scrolls, so a trackpad, which sends many small
 * scroll events, zooms as smoothly as a mouse wheel does in steps.
 */
export function useWheelZoom(
  ref: RefObject<HTMLElement | null>,
  plotArea: PlotArea,
  full: Viewport,
  minSpan: MinSpan,
  setView: Dispatch<SetStateAction<Viewport>>,
) {
  const { left, top, width, height } = plotArea

  useEffect(() => {
    const element = ref.current
    if (!element || width <= 0) return

    function onWheel(event: WheelEvent) {
      if (event.deltaY === 0) return
      // Stop the page scrolling while the pointer is over the plot.
      event.preventDefault()

      const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const fraction = {
        x: (event.clientX - bounds.left - left) / width,
        y: 1 - (event.clientY - bounds.top - top) / height,
      }
      const notches =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY / LINES_PER_NOTCH
          : event.deltaY / PIXELS_PER_NOTCH

      // The updater form reads the latest view, so this listener never sees a stale one.
      setView((view) => wheelZoom(view, fraction, notches, full, minSpan))
    }

    // React's own onWheel prop is passive and cannot stop the page scrolling, so listen directly.
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [ref, left, top, width, height, full, minSpan, setView])
}
