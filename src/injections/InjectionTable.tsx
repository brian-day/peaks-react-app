import type { Injection } from '../api/types'
import { formatNumber } from '../format'

type Props = {
  injections: Injection[]
  /** The dataset being looked at, whose injection is highlighted. */
  activeDataset: number
  onSelectDataset: (datasetIndex: number) => void
}

// Shown as the instrument's injection types are written, but spaced.
const TYPE_LABELS: Record<string, string> = {
  ColumnPrime: 'Column prime',
  ColumnFlush: 'Column flush',
}

/**
 * A protocol's injections, in the order they were made. An injection whose data is analyzed can
 * be clicked to look at it; the rest, such as blanks and standards, are listed but not analyzed,
 * as `AnalyzePeaks` analyzes a protocol.
 */
export function InjectionTable({ injections, activeDataset, onSelectDataset }: Props) {
  return (
    // Collapses as the settings do, to give the plot the room once an injection is chosen.
    <details className="injection-table" open>
      <summary>Injections</summary>
      <div className="injection-table-scroll">
        <table>
          <thead>
            <tr>
              <th className="numeric">#</th>
              <th>Type</th>
              <th>Sample</th>
              <th className="numeric">
                Volume<span className="units">µL</span>
              </th>
              <th>Gradient</th>
              <th className="numeric">
                Column temp.<span className="units">°C</span>
              </th>
              <th>Column position</th>
            </tr>
          </thead>
          <tbody>
            {injections.map((injection, position) => {
              const { datasetIndex } = injection
              const select = datasetIndex === null ? undefined : () => onSelectDataset(datasetIndex)
              return (
                <tr
                  // Injections have no identity beyond their place in the order.
                  key={position}
                  className={[
                    select ? 'injection-row--selectable' : 'injection-row--not-analyzed',
                    datasetIndex === activeDataset && 'injection-row--active',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={select ? 'Show this injection' : 'Not analyzed: only a protocol’s samples are'}
                  aria-selected={datasetIndex === activeDataset}
                  tabIndex={select ? 0 : undefined}
                  onClick={select}
                  onKeyDown={(event) => {
                    if (select && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault()
                      select()
                    }
                  }}
                >
                  <td className="numeric">{position + 1}</td>
                  <td>{injection.type && (TYPE_LABELS[injection.type] ?? injection.type)}</td>
                  <td>{injection.sample ?? '–'}</td>
                  <td className="numeric">{optional(injection.injectionVolume)}</td>
                  <td>{injection.gradient ?? '–'}</td>
                  <td className="numeric">{optional(injection.columnTemperature)}</td>
                  <td>{injection.columnPosition ?? '–'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </details>
  )
}

function optional(value: number | null) {
  return value === null ? '–' : formatNumber(value)
}
