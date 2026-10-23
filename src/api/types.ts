// The JSON that peaks_server sends, mirroring DVA's `peaks_server/src/session.rs` and
// `dva_lib/src/analyze_peaks/view.rs`. Hand-written for now; these should be generated from the
// Rust types once the shapes settle.

export type Point = { x: number; y: number }

/** A point as an `[x, y]` pair, the compact form used for long point lists. */
export type XY = [x: number, y: number]

export type CurvatureBoundaryType = 'Baseline' | 'Valley' | 'Shoulder' | 'Round'

export type PeakIdentity =
  | { kind: 'Peak'; value: number }
  | { kind: 'WithinThreshold'; value: [thresholdId: number, peakId: number] }

/** One end of a peak, where its baseline meets its envelope. */
export type PeakBoundary = {
  point: Point
  /** False once the baseline has been dragged off the trace at this end. */
  onTrace: boolean
  /** Null for methods that do not classify boundaries. */
  integrationType: CurvatureBoundaryType | null
}

export type PeakView = {
  id: PeakIdentity
  low: PeakBoundary
  high: PeakBoundary
  apex: Point
  /** The points tracing the peak above its baseline. */
  envelope: XY[]
  isParent: boolean
  /** Empty when the peak is unassigned. */
  label: string
  moleculeId: string | null
  editable: boolean
  expected: boolean
  excluded: boolean
}

export type ThresholdView = {
  id: number
  interval: { low: number; high: number }
  height: number
  expected: boolean
  peaks: PeakView[]
}

export type AnalysisView =
  | { kind: 'Peaks'; value: PeakView[] }
  | { kind: 'Thresholds'; value: ThresholdView[] }

export type ApiMessage = { level: 'Warning' | 'Error'; message: string }

export type DatasetSnapshot = {
  xUnits: string
  yUnits: string
  /** The downsampled trace. */
  trace: XY[]
  analysis: AnalysisView
}

export type CreatedSession = {
  sessionId: string
  /** Non-fatal messages from building the analysis. */
  messages: ApiMessage[]
  dataset: DatasetSnapshot
}

export type Method = 'Manual' | 'Threshold' | 'Curvature'

/** An edit to a session's analysis, mirroring DVA's `peaks_server/src/commands.rs`. */
export type Command =
  | { kind: 'setMethod'; method: Method }
  | { kind: 'addManualPeak'; low: number; high: number }
  | { kind: 'updateManualPeak'; peakId: number; low: Point; high: Point }

/** The analysis after an edit. */
export type CommandResult = { analysis: AnalysisView }
