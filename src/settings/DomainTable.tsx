import type { Command, DomainSettings } from '../api/types'
import { NumberField } from './NumberField'

type Props = {
  domains: DomainSettings[]
  units: { x: string; y: string }
  /** The domain whose row to highlight, by its index. */
  hoveredDomain: number | null
  /** Called with the domain whose row the pointer is over, or `null`. */
  onHoverDomain: (domainIndex: number | null) => void
  onCommand: (command: Command) => Promise<void>
}

/**
 * Curvature (vnext)'s domains, one row each in order of their start, with every setting a domain
 * has of its own. Rows are numbered as the commands number domains.
 */
export function DomainTable({ domains, units, hoveredDomain, onHoverDomain, onCommand }: Props) {
  const columns = [
    { label: 'Start', units: units.x },
    { label: 'End', units: units.x },
    { label: 'Smoothing', units: units.x },
    { label: 'Threshold', units: `${units.y}/${units.x}²` },
    { label: 'Liftoff', units: '%' },
    { label: 'Touchdown', units: '%' },
    { label: 'Min area', units: `${units.y}·${units.x}` },
    { label: 'Min height', units: units.y },
  ]

  return (
    <table className="domain-table">
      <thead>
        <tr>
          <th>Domain</th>
          {columns.map((column) => (
            <th key={column.label} className="numeric">
              {column.label}
              <span className="units">{column.units}</span>
            </th>
          ))}
          <th>
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
            <td>
              <NumberField
                label={`Domain ${domainIndex + 1} start`}
                hideLabel
                value={domain.start}
                onCommit={(start) => onCommand({ kind: 'setDomainRange', domainIndex, start, end: domain.end })}
              />
            </td>
            <td>
              <NumberField
                label={`Domain ${domainIndex + 1} end`}
                hideLabel
                value={domain.end}
                onCommit={(end) => onCommand({ kind: 'setDomainRange', domainIndex, start: domain.start, end })}
              />
            </td>
            <td>
              <NumberField
                label={`Domain ${domainIndex + 1} smoothing`}
                hideLabel
                value={domain.smoothing}
                onCommit={(value) => onCommand({ kind: 'setDomainSmoothing', domainIndex, value })}
              />
            </td>
            <td>
              <NumberField
                label={`Domain ${domainIndex + 1} threshold`}
                hideLabel
                value={domain.threshold}
                onCommit={(value) => onCommand({ kind: 'setDomainThreshold', domainIndex, value })}
              />
            </td>
            <td>
              <NumberField
                label={`Domain ${domainIndex + 1} liftoff`}
                hideLabel
                value={domain.liftOffPercent}
                onCommit={(liftOffPercent) =>
                  onCommand({
                    kind: 'setDomainLiftOffTouchDown',
                    domainIndex,
                    liftOffPercent,
                    touchDownPercent: domain.touchDownPercent,
                  })
                }
              />
            </td>
            <td>
              <NumberField
                label={`Domain ${domainIndex + 1} touchdown`}
                hideLabel
                value={domain.touchDownPercent}
                onCommit={(touchDownPercent) =>
                  onCommand({
                    kind: 'setDomainLiftOffTouchDown',
                    domainIndex,
                    liftOffPercent: domain.liftOffPercent,
                    touchDownPercent,
                  })
                }
              />
            </td>
            <td>
              <NumberField
                label={`Domain ${domainIndex + 1} minimum area`}
                hideLabel
                value={domain.minArea}
                onCommit={(area) =>
                  onCommand({ kind: 'setDomainMinimumPeakSize', domainIndex, area, height: domain.minHeight })
                }
              />
            </td>
            <td>
              <NumberField
                label={`Domain ${domainIndex + 1} minimum height`}
                hideLabel
                value={domain.minHeight}
                onCommit={(height) =>
                  onCommand({ kind: 'setDomainMinimumPeakSize', domainIndex, area: domain.minArea, height })
                }
              />
            </td>
            <td>
              <button
                type="button"
                className="remove-domain"
                aria-label={`Remove domain ${domainIndex + 1}`}
                title={domains.length === 1 ? 'An analysis needs at least one domain' : 'Remove this domain'}
                disabled={domains.length === 1}
                onClick={() => onCommand({ kind: 'removeDomain', domainIndex })}
              >
                ×
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
