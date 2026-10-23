import { useMemo } from 'react'
import type { Overlays } from '../api/types'
import { usePlot } from './plotContext'
import { dataPath, dataTransform, type Scale } from './scale'

/** Which overlays are drawn. */
export type ShownOverlays = { smoothed: boolean; secondDerivative: boolean }

type Props = {
  overlays: Overlays
  shown: ShownOverlays
  /** Maps −y'' to pixels, separately from the trace's y scale; it has its own axis. */
  secondDerivativeScale: Scale
}

/** The curvature method's smoothed data and −y'' curve, drawn over the trace. */
export function OverlayLayer({ overlays, shown, secondDerivativeScale }: Props) {
  const { xScale, yScale } = usePlot()

  // Built once per fetch, like the trace; zooming only changes the transforms.
  const smoothedPath = useMemo(() => dataPath(overlays.smoothed), [overlays.smoothed])
  const secondDerivativePath = useMemo(
    () => dataPath(overlays.negativeSecondDerivative),
    [overlays.negativeSecondDerivative],
  )

  return (
    <g>
      {shown.secondDerivative && (
        <path
          className="overlay overlay--second-derivative"
          d={secondDerivativePath}
          transform={dataTransform(xScale, secondDerivativeScale)}
        />
      )}
      {shown.smoothed && (
        <path className="overlay overlay--smoothed" d={smoothedPath} transform={dataTransform(xScale, yScale)} />
      )}
    </g>
  )
}
