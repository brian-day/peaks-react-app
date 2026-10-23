import { peakKey } from '../api/peakIdentity'
import type { AnalysisView, Point } from '../api/types'
import { PeakShape } from './PeakShape'
import { usePlot } from './plotContext'

type Props = {
  analysis: AnalysisView
  onMoveBoundaries: (peakId: number, low: Point, high: Point) => Promise<void>
}

/** Draws whatever the analysis found: peaks directly, or thresholds with their peaks. */
export function AnalysisLayer({ analysis, onMoveBoundaries }: Props) {
  const { xScale, yScale } = usePlot()

  switch (analysis.kind) {
    case 'Peaks':
      return (
        <g>
          {analysis.value.map((peak) => (
            <PeakShape key={peakKey(peak.id)} peak={peak} onMoveBoundaries={onMoveBoundaries} />
          ))}
        </g>
      )

    case 'Thresholds':
      return (
        <g>
          {analysis.value.map((threshold) => (
            <g key={threshold.id}>
              <line
                className={threshold.expected ? 'threshold' : 'threshold threshold--unexpected'}
                x1={xScale(threshold.interval.low)}
                x2={xScale(threshold.interval.high)}
                y1={yScale(threshold.height)}
                y2={yScale(threshold.height)}
              />
              {threshold.peaks.map((peak) => (
                <PeakShape key={peakKey(peak.id)} peak={peak} onMoveBoundaries={onMoveBoundaries} />
              ))}
            </g>
          ))}
        </g>
      )
  }
}
