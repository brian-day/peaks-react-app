import { useCallback, useMemo, useState } from 'react'
import type { XY } from '../api/types'
import {
  fitToVisible,
  followProportionally,
  traceBounds,
  UNBOUNDED,
  type Domain,
  type PlotView,
  type SecondaryAxis,
  type Viewport,
} from './viewport'

/**
 * What part of the trace the plot shows, and of −y'' on its own axis, with the ways to change it.
 *
 * `secondDerivative` is the −y'' curve the axis fits to, or `null` before it is fetched, and
 * `secondaryShown` whether its axis is drawn. The view starts fully zoomed out and is kept as the
 * trace and curve change; give the component a new `key` to start over.
 */
export function usePlotView(trace: readonly XY[], secondDerivative: readonly XY[] | null, secondaryShown: boolean) {
  const { full, minSpan } = useMemo(() => traceBounds(trace), [trace])
  const [view, setView] = useState<PlotView>({ ...full, y2: null })

  // The whole −y'' curve's range: where its axis starts and is reset to, though not a limit on it.
  const secondFull = useMemo(() => secondDerivative && fitToVisible(secondDerivative, UNBOUNDED), [secondDerivative])
  const secondary = useMemo<SecondaryAxis | null>(
    () =>
      secondaryShown && secondFull ? { whole: secondFull, minSpan: (secondFull[1] - secondFull[0]) / 10000 } : null,
    [secondaryShown, secondFull],
  )

  // −y'' spans the whole curve until the user first moves it. After that it keeps its range when the
  // curve is fetched again, so before and after an edit compare at the same scale.
  const secondView = view.y2 ?? secondFull

  // A zoom box or pan in the plot area moves −y'' along with the trace's y, by the same proportion.
  const changePlotView = useCallback(
    (next: Viewport) =>
      setView((current) => {
        const y2 = current.y2 ?? secondFull
        return { x: next.x, y: next.y, y2: y2 && followProportionally(current.y, next.y, y2) }
      }),
    [secondFull],
  )

  return {
    view,
    /** For updates computed from the current view, such as the wheel zoom's. */
    setView,
    full,
    minSpan,
    /** The −y'' axis's range, or `null` while there is no curve to give it one. */
    secondView,
    /** The −y'' axis while it is drawn, for the wheel zoom. */
    secondary,
    changePlotView,
    /** Pans or zooms one axis on its own. */
    changeAxis: (axis: 'x' | 'y' | 'y2', domain: Domain) => setView((current) => ({ ...current, [axis]: domain })),
    /** Zooms all the way out. */
    resetView: () => setView({ ...full, y2: secondFull }),
    /** Fits the −y'' axis to the part of the curve within the visible x range. */
    fitSecondToView: () =>
      setView((current) => ({
        ...current,
        y2: (secondDerivative && fitToVisible(secondDerivative, current.x)) ?? secondFull,
      })),
  }
}
