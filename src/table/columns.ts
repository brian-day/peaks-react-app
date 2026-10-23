// How each of the table's columns is labelled and its values shown. The values themselves come
// from peaks_server; nothing here computes a peak property.

import type { CellValue, ColumnKey, CurvatureBoundaryType } from '../api/types'

/** The data's axis units, which most columns' units derive from. */
export type AxisUnits = { x: string; y: string }

export type ColumnDefinition = {
  key: ColumnKey
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
    label: 'Rel. area',
    description: "Area relative to the parent peak's",
    units: unitless,
  },
  {
    key: 'relativePosition',
    label: 'Rel. position',
    description: "Position relative to the parent peak's",
    units: unitless,
  },
  {
    key: 'integrationType',
    label: 'Int. type',
    description: 'How each end meets its neighbour: B = baseline, V = valley, S = shoulder, R = round',
    units: unitless,
  },
  { key: 'peakStart', label: 'Start', description: 'Where the peak begins', units: xUnits },
  { key: 'peakEnd', label: 'End', description: 'Where the peak ends', units: xUnits },
  { key: 'tailFactor', label: 'Tail factor', description: 'USP tailing factor at 5% of the height', units: unitless },
  {
    key: 'widthAtHalfHeight',
    label: 'Width at ½ ht',
    description: 'Width of the peak at half its height',
    units: xUnits,
  },
  { key: 'snr', label: 'SNR', description: 'Signal-to-noise ratio', units: unitless },
  {
    key: 'uspResolution',
    label: 'USP res.',
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
    label: 'P/V start',
    description: 'Peak-to-valley ratio at the start, for valley boundaries',
    units: unitless,
  },
  {
    key: 'peakToValleyEnd',
    label: 'P/V end',
    description: 'Peak-to-valley ratio at the end, for valley boundaries',
    units: unitless,
  },
]

/** The columns shown until the user picks others, as in the Mathematica preview. */
export const DEFAULT_COLUMNS: ColumnKey[] = [
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

// Four significant figures reads well for most values; at 1000 and above that would round away
// digits before the decimal point, so those keep every whole digit instead.
const SMALL_NUMBER = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 4 })
const LARGE_NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** A cell's value as it appears in the table. */
export function formatCell(value: CellValue): string {
  if (value === null) return '–'
  if (typeof value === 'string') return value
  if (typeof value === 'number') {
    return (Math.abs(value) >= 1000 ? LARGE_NUMBER : SMALL_NUMBER).format(value)
  }
  return BOUNDARY_LETTERS[value.low] + BOUNDARY_LETTERS[value.high]
}
