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
  /** Which of the session's datasets this is, counted from 1. */
  index: number
  xUnits: string
  yUnits: string
  /** The trace: every point, or about 100k of them if it has more. */
  trace: XY[]
  analysis: AnalysisView
  table: PeakRow[]
  /** `null` unless the Curvature method is active. */
  curvatureSettings: CurvatureSettings | null
  /** `null` unless the Curvature (vnext) method is active. */
  vnextSettings: VnextSettings | null
}

export type SmoothingMethod = 'Gaussian' | 'SavitzkyGolay'

/**
 * The Curvature method's peak detection settings in effect, for its first domain, mirroring DVA's
 * `peaks_server/src/settings.rs`. An automatic setting shows the value it resolved to.
 */
export type CurvatureSettings = {
  smoothingMethod: SmoothingMethod
  /** The smoothing filter's width in x units: the Gaussian's sigma, or the Savitzky–Golay window. */
  smoothing: number
  /** The −y'' above which a peak's apex is looked for. */
  thresholdHeight: number
  /** The x range the threshold applies over. */
  thresholdStart: number
  thresholdEnd: number
  liftOffPercent: number
  touchDownPercent: number
  /** Peaks with less area, or less height, than these are excluded. */
  minArea: number
  minHeight: number
}

/**
 * The Curvature (vnext) method's settings, mirroring DVA's `peaks_server/src/settings.rs`: a
 * shared smoothing, and each domain's own settings. Settings in effect, as with
 * {@link CurvatureSettings}.
 */
export type VnextSettings = {
  smoothingMethod: SmoothingMethod
  /** The smoothing width, in x units, of every domain that does not set its own. */
  smoothing: number
  /** In order of their start; commands and table rows number domains by position here. */
  domains: DomainSettings[]
}

export type DomainSettings = {
  start: number
  end: number
  /** The smoothing width this domain is detected at. */
  smoothing: number
  /** Whether that is the shared width, rather than one the domain sets itself. */
  defaultSmoothing: boolean
  threshold: number
  liftOffPercent: number
  touchDownPercent: number
  minArea: number
  minHeight: number
}

/** The table's columns, mirroring DVA's `peaks_server/src/table.rs`. */
export type ColumnKey =
  | 'position'
  | 'height'
  | 'area'
  | 'percentArea'
  | 'relativeArea'
  | 'relativePosition'
  | 'tailFactor'
  | 'snr'
  | 'integrationType'
  | 'peakStart'
  | 'peakEnd'
  | 'widthAtHalfHeight'
  | 'uspResolution'
  | 'theoreticalPlateNumber'
  | 'peakToValleyStart'
  | 'peakToValleyEnd'

/** A column's value for one peak; `null` when the column does not apply to it. */
export type CellValue = number | string | { low: CurvatureBoundaryType; high: CurvatureBoundaryType } | null

/** One peak's row of the table. */
export type PeakRow = {
  /** The same identity the peak has in the analysis view. */
  id: PeakIdentity
  kind: 'included' | 'excluded' | 'unexpected'
  values: Record<ColumnKey, CellValue>
  /** Under Curvature (vnext), the position of the domain the peak was found in; otherwise `null`. */
  domain: number | null
}

/** What can be analyzed, named as SLL names its type. */
export type ObjectType = 'Object[Data, Chromatography]' | 'Object[Protocol, HPLC]' | 'Object[Protocol, FPLC]'

export type DatasetSummary = {
  /** Counted from 1. */
  index: number
  /** The ID of the `Object[Data]` it was downloaded from; `null` for data with no object. */
  dataObject: string | null
}

/** One injection of a protocol, mirroring DVA's `peaks_server/src/injection_table.rs`. */
export type Injection = {
  /** `'Sample'`, `'Blank'`, `'Standard'`, `'ColumnPrime'` or `'ColumnFlush'`. */
  type: string | null
  /** The sample's name, or its ID if it has none. */
  sample: string | null
  /** In microliters. */
  injectionVolume: number | null
  /** The gradient method's name, or its ID if it has none. */
  gradient: string | null
  /** In degrees Celsius. */
  columnTemperature: number | null
  columnPosition: string | null
  dataObject: string | null
  /** The session's dataset for this injection, or `null` if its data is not analyzed. */
  datasetIndex: number | null
}

export type CreatedSession = {
  sessionId: string
  /** Non-fatal messages from building the analysis. */
  messages: ApiMessage[]
  /** Every dataset in the analysis, in order. */
  datasets: DatasetSummary[]
  /** A protocol's injections, in order; `null` for a data object. */
  injectionTable: Injection[] | null
  /** The dataset being looked at, which starts as the first. */
  dataset: DatasetSnapshot
}

export type Method = 'Manual' | 'Threshold' | 'Curvature' | 'CurvatureVnext'

/** An edit to a session's analysis, mirroring DVA's `peaks_server/src/commands.rs`. */
export type Command =
  | { kind: 'setMethod'; method: Method }
  | { kind: 'addManualPeak'; low: number; high: number }
  | { kind: 'updateManualPeak'; peakId: number; low: Point; high: Point }
  // The Curvature method's detection settings. A `null` value lets the analysis choose it.
  | { kind: 'setSmoothingMethod'; method: SmoothingMethod }
  | { kind: 'setSmoothing'; value: number | null }
  | { kind: 'setThresholdHeight'; value: number | null }
  | { kind: 'setThresholdDomain'; start: number; end: number }
  | { kind: 'setLiftOffTouchDown'; liftOffPercent: number; touchDownPercent: number }
  | { kind: 'setMinimumPeakSize'; area: number; height: number }
  | { kind: 'resetDetection' }
  | { kind: 'resetLiftOffTouchDown' }
  | { kind: 'resetMinimumPeakSize' }
  // Curvature (vnext)'s domains, by their position in `VnextSettings.domains`. A `null` smoothing
  // uses the shared width; a `null` threshold lets the analysis choose it.
  | { kind: 'addDomain'; start: number; end: number }
  | { kind: 'removeDomain'; domainIndex: number }
  | { kind: 'setDomainRange'; domainIndex: number; start: number; end: number }
  | { kind: 'setDomainSmoothing'; domainIndex: number; value: number | null }
  | { kind: 'setDomainThreshold'; domainIndex: number; value: number | null }
  | { kind: 'setDomainLiftOffTouchDown'; domainIndex: number; liftOffPercent: number; touchDownPercent: number }
  | { kind: 'setDomainMinimumPeakSize'; domainIndex: number; area: number; height: number }

/**
 * Curves drawn over the trace under the Curvature methods, mirroring DVA's
 * `peaks_server/src/overlays.rs`.
 */
export type Overlays = {
  /** `[x, -y'']` of the smoothed data, whose bumps are the peaks. Under Curvature (vnext), each
   * domain's stretch is at that domain's own smoothing. */
  negativeSecondDerivative: XY[]
  /** Under Curvature (vnext), each domain as `[start, end]`, in order; otherwise `null`. */
  domains: [start: number, end: number][] | null
}

/** The analysis, its table and its detection settings after an edit. */
export type CommandResult = {
  analysis: AnalysisView
  table: PeakRow[]
  curvatureSettings: CurvatureSettings | null
  vnextSettings: VnextSettings | null
}
