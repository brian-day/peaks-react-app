import { useMemo, useState } from 'react'
import { allPeaks, peakKey } from '../api/peakIdentity'
import type { AnalysisView, ColumnKey, PeakRow } from '../api/types'
import { ColumnPicker } from './ColumnPicker'
import { COLUMNS, DEFAULT_COLUMNS, formatCell, type AxisUnits } from './columns'

type Props = {
  rows: PeakRow[]
  /** The analysis the rows belong to, for each peak's label and whether it is the parent. */
  analysis: AnalysisView
  units: AxisUnits
}

const KIND_LABELS: Record<PeakRow['kind'], string | null> = {
  included: null,
  excluded: 'Excluded',
  unexpected: 'Unexpected',
}

/** The peaks' properties, one row per peak, with a choice of which columns to show. */
export function PeaksTable({ rows, analysis, units }: Props) {
  const [shown, setShown] = useState<ReadonlySet<ColumnKey>>(() => new Set(DEFAULT_COLUMNS))
  const columns = COLUMNS.filter((column) => shown.has(column.key))

  const peaksByKey = useMemo(
    () => new Map(allPeaks(analysis).map((peak) => [peakKey(peak.id), peak])),
    [analysis],
  )

  return (
    <section className="peaks-table">
      <div className="peaks-table-toolbar">
        <h2>Peaks</h2>
        <ColumnPicker shown={shown} onChange={setShown} />
      </div>

      {rows.length === 0 ? (
        <p className="status">No peaks.</p>
      ) : (
        <div className="peaks-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Parent</th>
                <th>Status</th>
                {columns.map((column) => {
                  const columnUnits = column.units(units)
                  return (
                    <th key={column.key} className="numeric" title={column.description}>
                      {column.label}
                      {columnUnits && <span className="units">{columnUnits}</span>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const key = peakKey(row.id)
                const peak = peaksByKey.get(key)
                const kindLabel = KIND_LABELS[row.kind]
                return (
                  <tr key={key} className={kindLabel ? 'peak-row peak-row--muted' : 'peak-row'}>
                    <td>{peak?.label || '–'}</td>
                    <td>{peak?.isParent ? '✓' : ''}</td>
                    <td>{kindLabel ?? ''}</td>
                    {columns.map((column) => (
                      <td key={column.key} className="numeric">
                        {formatCell(row.values[column.key])}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
