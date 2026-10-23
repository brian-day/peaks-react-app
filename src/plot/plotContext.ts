import { createContext, useContext } from 'react'
import type { Point } from '../api/types'
import type { Scale } from './scale'

/** The plot's coordinate system, for anything drawn or dragged inside its plot area. */
export type PlotGeometry = {
  xScale: Scale
  yScale: Scale
  /** The plot area's size in pixels. */
  width: number
  height: number
  /** Where a pointer is, in pixels from the plot area's top-left corner. */
  pointerToPixels: (event: { clientX: number; clientY: number }) => Point
  /** Where a pointer is, in data coordinates on the trace's axes. */
  pointerToData: (event: { clientX: number; clientY: number }) => Point
}

export const PlotContext = createContext<PlotGeometry | null>(null)

/** The geometry of the plot this component is drawn in. */
export function usePlot(): PlotGeometry {
  const plot = useContext(PlotContext)
  if (!plot) throw new Error('usePlot must be called inside a ChromatogramPlot')
  return plot
}
