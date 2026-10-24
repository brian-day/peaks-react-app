import { useMemo } from 'react'
import type { InjectionTrace } from '../api/types'
import { usePlot } from './plotContext'
import { dataPath, dataTransform } from './scale'

type Props = {
  traces: InjectionTrace[]
  /** The dataset being looked at, whose own trace is drawn in full elsewhere. */
  activeDataset: number
}

/**
 * The other injections' traces, faint and behind the active one, to compare it with. They are
 * only drawn: they have no peaks, settings or domains here.
 */
export function OtherTraces({ traces, activeDataset }: Props) {
  const { xScale, yScale } = usePlot()

  // Built once per fetch and change of dataset; zooming only changes the transform.
  const path = useMemo(
    () =>
      traces
        .filter((trace) => trace.datasetIndex !== activeDataset)
        .map((trace) => dataPath(trace.points))
        .join(''),
    [traces, activeDataset],
  )

  return <path className="other-traces" d={path} transform={dataTransform(xScale, yScale)} />
}
