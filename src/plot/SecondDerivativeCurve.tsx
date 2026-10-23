import { useMemo } from 'react'
import type { XY } from '../api/types'
import { usePlot } from './plotContext'
import { dataPath, dataTransform, type Scale } from './scale'

type Props = {
  /** `[x, -y'']` of the smoothed data, from the Curvature method. */
  points: XY[]
  /** Maps −y'' to pixels, separately from the trace's y scale; it has its own axis. */
  scale: Scale
}

/** The Curvature method's −y'' curve, drawn over the trace; its bumps are the peaks. */
export function SecondDerivativeCurve({ points, scale }: Props) {
  const { xScale } = usePlot()

  // Built once per fetch, like the trace; zooming only changes the transform.
  const path = useMemo(() => dataPath(points), [points])

  return <path className="second-derivative" d={path} transform={dataTransform(xScale, scale)} />
}
