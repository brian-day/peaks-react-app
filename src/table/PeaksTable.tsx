import { useMemo, useState } from 'react'
import { allPeaks, peakKey } from '../api/peakIdentity'
import type { AnalysisView, ColumnKey, PeakRow, PeakView } from '../api/types'
import { formatNumber } from '../format'
import { ColumnPicker } from './ColumnPicker'
import { COLUMNS, DEFAULT_COLUMNS, formatCell, type AxisUnits, type ColumnDefinition } from './columns'
import { groupByDomain } from './groups'

type Props = {
  rows: PeakRow[]
  /** The analysis the rows belong to, for each peak's label and whether it is the parent. */
  analysis: AnalysisView
  units: AxisUnits
  /** Under Curvature (vnext), the domains, to group the peaks by; otherwise `null`. */
  domains: readonly { start: number; end: number }[] | null
  /** The {@link peakKey} of the peak to highlight, whether hovered here or in the plot. */
  hoveredKey: string | null
  /** Called with a row's peak as the pointer enters it, and `null` as it leaves. */
  onHoverPeak: (key: string | null) => void
}

const KIND_LABELS: Record<PeakRow['kind'], string | null> = {
  included: null,
  excluded: 'Excluded',
  unexpected: 'Unexpected',
}

/**
 * The peaks' properties, one row per peak, with a choice of which columns to show. Under
 * Curvature (vnext) the peaks are grouped by the domain they were found in, under a heading
 * giving its range that collapses the group, and a domain that found none says so.
 */
export function PeaksTable({ rows, analysis, units, domains, hoveredKey, onHoverPeak }: Props) {
  const [shown, setShown] = useState<ReadonlySet<ColumnKey>>(() => new Set(DEFAULT_COLUMNS))
  const columns = COLUMNS.filter((column) => shown.has(column.key))

  const peaksByKey = useMemo(
    () => new Map(allPeaks(analysis).map((peak) => [peakKey(peak.id), peak])),
    [analysis],
  )
  // The groups collapsed, by domain, with `null` for the peaks outside the domains. Domains are
  // known only by their place in order, so removing one passes its collapse on to the next.
  const [collapsed, setCollapsed] = useState<ReadonlySet<number | null>>(() => new Set())
  const toggle = (domain: number | null) =>
    setCollapsed((current) => {
      const next = new Set(current)
      if (!next.delete(domain)) next.add(domain)
      return next
    })

  const groups = useMemo(() => domains && groupByDomain(rows, domains.length), [rows, domains])
  // Label, Parent and Status, then the chosen columns.
  const columnCount = 3 + columns.length

  const renderRow = (row: PeakRow) => {
    const key = peakKey(row.id)
    return (
      <Row
        key={key}
        row={row}
        peak={peaksByKey.get(key)}
        columns={columns}
        highlighted={key === hoveredKey}
        onHover={(hovered) => onHoverPeak(hovered ? key : null)}
      />
    )
  }

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
            {groups ? (
              groups.map(({ domain, rows: groupRows }) => {
                const range = domain === null ? null : domains?.[domain]
                const open = !collapsed.has(domain)
                return (
                  // One body per domain; the domain's place in order is all that tells it apart.
                  <tbody key={domain ?? 'outside'}>
                    <tr className="domain-heading">
                      <th colSpan={columnCount}>
                        <button type="button" aria-expanded={open} onClick={() => toggle(domain)}>
                          <span className="domain-heading-arrow" aria-hidden="true">
                            {open ? '▼' : '▶'}
                          </span>
                          {domain !== null && range
                            ? `Domain ${domain + 1} · ${formatNumber(range.start)}–${formatNumber(range.end)} ${units.x}`
                            : 'Outside the domains'}
                          {/* Says how many are hidden while collapsed. */}
                          {!open && <span className="domain-heading-count">{peakCount(groupRows.length)}</span>}
                        </button>
                      </th>
                    </tr>
                    {!open ? null : groupRows.length === 0 ? (
                      <tr className="peak-row--muted">
                        <td colSpan={columnCount}>No peaks.</td>
                      </tr>
                    ) : (
                      groupRows.map(renderRow)
                    )}
                  </tbody>
                )
              })
            ) : (
              <tbody>{rows.map(renderRow)}</tbody>
            )}
          </table>
        </div>
      )}
    </section>
  )
}

type RowProps = {
  row: PeakRow
  /** The row's peak in the analysis, for its label and whether it is the parent. */
  peak: PeakView | undefined
  columns: ColumnDefinition[]
  highlighted: boolean
  onHover: (hovered: boolean) => void
}

/** One peak's row. */
function Row({ row, peak, columns, highlighted, onHover }: RowProps) {
  const kindLabel = KIND_LABELS[row.kind]
  return (
    <tr
      className={['peak-row', kindLabel && 'peak-row--muted', highlighted && 'peak-row--highlighted']
        .filter(Boolean)
        .join(' ')}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
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
}

function peakCount(count: number) {
  return count === 1 ? '1 peak' : `${count} peaks`
}
