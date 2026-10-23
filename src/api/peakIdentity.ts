import type { AnalysisView, PeakIdentity, PeakView } from './types'

/** A string unique to each peak in an analysis, for React keys and lookups. */
export function peakKey(id: PeakIdentity): string {
  return id.kind === 'Peak' ? `${id.value}` : `${id.value[0]}-${id.value[1]}`
}

/** Every peak in the analysis, whether found directly or beneath thresholds. */
export function allPeaks(analysis: AnalysisView): PeakView[] {
  return analysis.kind === 'Peaks' ? analysis.value : analysis.value.flatMap((threshold) => threshold.peaks)
}
