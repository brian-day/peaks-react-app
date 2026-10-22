import type { AnalysisView, PeakIdentity } from '../api/types'
import { PeakShape } from './PeakShape'
import type { Scale } from './scale'

type Props = {
  analysis: AnalysisView
  xScale: Scale
  yScale: Scale
}

/** Draws whatever the analysis found: peaks directly, or thresholds with their peaks. */
export function AnalysisLayer({ analysis, xScale, yScale }: Props) {
  switch (analysis.kind) {
    case 'Peaks':
      return (
        <g>
          {analysis.value.map((peak) => (
            <PeakShape key={peakKey(peak.id)} peak={peak} xScale={xScale} yScale={yScale} />
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
                <PeakShape key={peakKey(peak.id)} peak={peak} xScale={xScale} yScale={yScale} />
              ))}
            </g>
          ))}
        </g>
      )
  }
}

function peakKey(id: PeakIdentity): string {
  return id.kind === 'Peak' ? `${id.value}` : `${id.value[0]}-${id.value[1]}`
}
