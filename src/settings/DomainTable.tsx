import type { Command, DomainSettings } from '../api/types'
import type { DomainEdits } from './domainEdits'
import { NumberField } from './NumberField'

type Props = {
  domains: DomainSettings[]
  /** The commands each edit sends, for whichever Curvature method is active. */
  edits: DomainEdits
  units: { x: string; y: string }
  /** The domain whose row to highlight, by its index. */
  hoveredDomain: number | null
  /** Called with the domain whose row the pointer is over, or `null`. */
  onHoverDomain: (domainIndex: number | null) => void
  onCommand: (command: Command) => Promise<void>
}

/** One of a domain's settings: how it is headed, shown and changed. */
type DomainColumn = {
  /** The heading over a run of related columns, such as `Baseline`. */
  group: string
  label: string
  /** How a screen reader names the field, after `Domain 2 `. */
  name: string
  units: string
  value: (domain: DomainSettings) => number
  /** The edit that sets this setting of the domain at `domainIndex` to `value`. */
  command: (domainIndex: number, domain: DomainSettings, value: number) => Command
}

function domainColumns(units: Props['units'], edits: DomainEdits): DomainColumn[] {
  return [
    {
      group: 'Range',
      label: 'Start',
      name: 'start',
      units: units.x,
      value: (domain) => domain.start,
      command: (domainIndex, domain, start) => edits.setRange(domainIndex, start, domain.end),
    },
    {
      group: 'Range',
      label: 'End',
      name: 'end',
      units: units.x,
      value: (domain) => domain.end,
      command: (domainIndex, domain, end) => edits.setRange(domainIndex, domain.start, end),
    },
    {
      group: 'Smoothing',
      label: 'Width',
      name: 'smoothing',
      units: units.x,
      value: (domain) => domain.smoothing,
      command: (domainIndex, _, value) => edits.setSmoothing(domainIndex, value),
    },
    {
      group: 'Smoothing',
      label: 'Threshold',
      name: 'threshold',
      units: `${units.y}/${units.x}²`,
      value: (domain) => domain.threshold,
      command: (domainIndex, _, value) => edits.setThreshold(domainIndex, value),
    },
    {
      group: 'Baseline',
      label: 'Liftoff',
      name: 'liftoff',
      units: '%',
      value: (domain) => domain.liftOffPercent,
      command: (domainIndex, domain, liftOffPercent) =>
        edits.setLiftOffTouchDown(domainIndex, liftOffPercent, domain.touchDownPercent),
    },
    {
      group: 'Baseline',
      label: 'Touchdown',
      name: 'touchdown',
      units: '%',
      value: (domain) => domain.touchDownPercent,
      command: (domainIndex, domain, touchDownPercent) =>
        edits.setLiftOffTouchDown(domainIndex, domain.liftOffPercent, touchDownPercent),
    },
    {
      group: 'Exclusions',
      label: 'Min Area',
      name: 'minimum area',
      units: `${units.y}·${units.x}`,
      value: (domain) => domain.minArea,
      command: (domainIndex, domain, area) => edits.setMinimumPeakSize(domainIndex, area, domain.minHeight),
    },
    {
      group: 'Exclusions',
      label: 'Min Height',
      name: 'minimum height',
      units: units.y,
      value: (domain) => domain.minHeight,
      command: (domainIndex, domain, height) => edits.setMinimumPeakSize(domainIndex, domain.minArea, height),
    },
  ]
}

/** The columns' groups, in order, with how many columns each spans. */
function groupRuns(columns: DomainColumn[]): { group: string; span: number }[] {
  const runs: { group: string; span: number }[] = []
  for (const { group } of columns) {
    const last = runs.at(-1)
    if (last?.group === group) last.span += 1
    else runs.push({ group, span: 1 })
  }
  return runs
}

/** Whether a column starts its group, and so has the line dividing it from the group before. */
function startsGroup(columns: DomainColumn[], index: number) {
  return columns[index - 1]?.group !== columns[index].group
}

/**
 * The domains peaks are detected in, one row each in order of their start, with every setting a
 * domain has of its own, grouped under headings. Rows are numbered as the commands number domains.
 */
export function DomainTable({ domains, edits, units, hoveredDomain, onHoverDomain, onCommand }: Props) {
  const columns = domainColumns(units, edits)
  const { remove } = edits
  const groupClass = (index: number) => (startsGroup(columns, index) ? 'group-start' : undefined)

  return (
    <div className="table-frame">
      <table className="domain-table">
        <thead>
          <tr className="domain-table-groups">
            <th />
            {groupRuns(columns).map(({ group, span }) => (
              <th key={group} colSpan={span} className="group-start">
                {group}
              </th>
            ))}
            <th className="group-start" />
          </tr>
          <tr>
            <th>Domain</th>
            {columns.map((column, index) => (
              <th key={column.name} className={groupClass(index)}>
                {column.label}
                <span className="units">{column.units}</span>
              </th>
            ))}
            <th className="group-start">
              <span className="visually-hidden">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {domains.map((domain, domainIndex) => (
            // Domains have no identity of their own beyond their place in order.
            <tr
              key={domainIndex}
              className={domainIndex === hoveredDomain ? 'domain-row--highlighted' : undefined}
              onPointerEnter={() => onHoverDomain(domainIndex)}
              onPointerLeave={() => onHoverDomain(null)}
            >
              <td>{domainIndex + 1}</td>
              {columns.map((column, index) => (
                <td key={column.name} className={groupClass(index)}>
                  <NumberField
                    label={`Domain ${domainIndex + 1} ${column.name}`}
                    hideLabel
                    value={column.value(domain)}
                    onCommit={(value) => onCommand(column.command(domainIndex, domain, value))}
                  />
                </td>
              ))}
              <td className="group-start">
                <button
                  type="button"
                  className="remove-domain"
                  aria-label={`Remove domain ${domainIndex + 1}`}
                  title={
                    !remove
                      ? 'This method has one domain, its threshold\u2019s range'
                      : domains.length === 1
                        ? 'An analysis needs at least one domain'
                        : 'Remove this domain'
                  }
                  disabled={!remove || domains.length === 1}
                  onClick={() => remove && onCommand(remove(domainIndex))}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
