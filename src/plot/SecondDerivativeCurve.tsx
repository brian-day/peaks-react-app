import { useMemo } from 'react'
import type { XY } from '../api/types'
import { usePlot } from './plotContext'
import { dataPath, dataTransform, type Scale } from './scale'

type Props = {
  /** `[x, -y'']` of the smoothed data, from a Curvature method, in stretches drawn unjoined. */
  stretches: XY[][]
  /** Maps −y'' to pixels, separately from the trace's y scale; it has its own axis. */
  scale: Scale
}

/** The Curvature method's −y'' curve, drawn over the trace; its bumps are the peaks. */
export function SecondDerivativeCurve({ stretches, scale }: Props) {
  const { xScale } = usePlot()

  // Built once per fetch, like the trace; zooming only changes the transform. Each stretch starts
  // its own subpath, so nothing joins one domain's stretch to the next across the gap.
  const path = useMemo(() => stretches.map(dataPath).join(''), [stretches])

  return <path className="second-derivative" d={path} transform={dataTransform(xScale, scale)} />
}
