// How each of the table's columns is labelled and its values shown.

import type { CellValue, ColumnKey, CurvatureBoundaryType, PeakRow, PeakView } from '../api/types'
import { formatNumber } from '../format'

/** The data's axis units, which most columns' units derive from. */
export type AxisUnits = { x: string; y: string }

/**
 * Columns about the peak itself rather than measured from it, read from the analysis and the row's
 * kind rather than from its values.
 */
export type PeakFactKey = 'label' | 'parent' | 'status'

/** Any column the table can show: a fact about the peak, or one of the server's measurements. */
export type TableColumnKey = PeakFactKey | ColumnKey

export type ColumnDefinition = {
  key: TableColumnKey
  label: string
  /** A fuller description, shown on hover. */
  description: string
  /** The column's units for data in the given axis units, or `null` if it has none. */
  units: (axis: AxisUnits) => string | null
}

const xUnits = (axis: AxisUnits) => axis.x
const yUnits = (axis: AxisUnits) => axis.y
const unitless = () => null

/** Every column, in the order they are shown. */
export const COLUMNS: ColumnDefinition[] = [
  { key: 'label', label: 'Label', description: 'The molecule the peak is assigned to, or its label', units: unitless },
  {
    key: 'parent',
    label: 'Parent',
    description: 'Whether this is the parent peak, which the relative area and position are measured against',
    units: unitless,
  },
  {
    key: 'status',
    label: 'Status',
    description: 'Blank for an included peak; otherwise whether it is excluded or unexpected',
    units: unitless,
  },
  { key: 'position', label: 'Position', description: 'Where the apex is', units: xUnits },
  { key: 'height', label: 'Height', description: 'Height of the apex above the baseline', units: yUnits },
  {
    key: 'area',
    label: 'Area',
    description: 'Area between the peak and its baseline',
    units: (axis) => `${axis.y}·${axis.x}`,
  },
  {
    key: 'percentArea',
    label: 'Area %',
    description: "This peak's share of the area of all included peaks",
    // The label already says it is a percentage.
    units: unitless,
  },
  {
    key: 'relativeArea',
    label: 'Rel. Area',
    description: "Area relative to the parent peak's",
    units: unitless,
  },
  {
    key: 'relativePosition',
    label: 'Rel. Position',
    description: "Position relative to the parent peak's",
    units: unitless,
  },
  {
    key: 'integrationType',
    label: 'Int. Type',
    description: 'How each end meets its neighbour: B = baseline, V = valley, S = shoulder, R = round',
    units: unitless,
  },
  { key: 'peakStart', label: 'Start', description: 'Where the peak begins', units: xUnits },
  { key: 'peakEnd', label: 'End', description: 'Where the peak ends', units: xUnits },
  { key: 'tailFactor', label: 'Tail Factor', description: 'USP tailing factor at 5% of the height', units: unitless },
  {
    key: 'widthAtHalfHeight',
    label: 'Width at ½ Ht',
    description: 'Width of the peak at half its height',
    units: xUnits,
  },
  { key: 'snr', label: 'SNR', description: 'Signal-to-noise ratio', units: unitless },
  {
    key: 'uspResolution',
    label: 'USP Res.',
    description: 'USP resolution from the previous peak',
    units: unitless,
  },
  {
    key: 'theoreticalPlateNumber',
    label: 'Plates',
    description: 'Theoretical plate number',
    units: unitless,
  },
  {
    key: 'peakToValleyStart',
    label: 'P/V Start',
    description: 'Peak-to-valley ratio at the start, for valley boundaries',
    units: unitless,
  },
  {
    key: 'peakToValleyEnd',
    label: 'P/V End',
    description: 'Peak-to-valley ratio at the end, for valley boundaries',
    units: unitless,
  },
]

/** The columns shown until the user picks others. Parent is left out, as nothing can set it yet. */
export const DEFAULT_COLUMNS: TableColumnKey[] = [
  'label',
  'status',
  'position',
  'height',
  'area',
  'percentArea',
  'relativeArea',
  'relativePosition',
]

const BOUNDARY_LETTERS: Record<CurvatureBoundaryType, string> = {
  Baseline: 'B',
  Valley: 'V',
  Shoulder: 'S',
  Round: 'R',
}

const STATUS_LABELS: Record<PeakRow['kind'], string> = {
  included: '',
  excluded: 'Excluded',
  unexpected: 'Unexpected',
}

/** Whether a column's values are numbers, which line up on the right. */
export function isNumeric(key: TableColumnKey): key is ColumnKey {
  return key !== 'label' && key !== 'parent' && key !== 'status'
}

/** What a column shows for a row, given the row's peak in the analysis, if it has one. */
export function cellText(key: TableColumnKey, row: PeakRow, peak: PeakView | undefined): string {
  switch (key) {
    case 'label':
      return peak?.label || '–'
    case 'parent':
      return peak?.isParent ? '✓' : ''
    case 'status':
      return STATUS_LABELS[row.kind]
    default:
      return formatCell(row.values[key])
  }
}

/** A cell's value as it appears in the table. */
export function formatCell(value: CellValue): string {
  if (value === null) return '–'
  if (typeof value === 'string') return value
  if (typeof value === 'number') return formatNumber(value)
  return BOUNDARY_LETTERS[value.low] + BOUNDARY_LETTERS[value.high]
}
