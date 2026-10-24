import type { Command, DomainSettings, SmoothingMethod } from '../api/types'
import { DomainTable } from './DomainTable'
import type { DomainEdits } from './domainEdits'
import { SmoothingMethodSelect } from './SmoothingMethodSelect'

type Props = {
  /** Shared by every domain. */
  smoothingMethod: SmoothingMethod
  domains: DomainSettings[]
  /** The commands the table's edits send, for whichever Curvature method is active. */
  edits: DomainEdits
  units: { x: string; y: string }
  /** The domain whose row to highlight, by its index. */
  hoveredDomain: number | null
  onHoverDomain: (domainIndex: number | null) => void
  onCommand: (command: Command) => Promise<void>
}

/**
 * The Curvature methods' peak detection settings: the smoothing method every domain shares, then
 * each domain's own settings. The Curvature method has one domain, its threshold's range. Every
 * change re-runs the detection, and the peaks, table and −y'' follow.
 */
export function DetectionSettings({
  smoothingMethod,
  domains,
  edits,
  units,
  hoveredDomain,
  onHoverDomain,
  onCommand,
}: Props) {
  return (
    <details className="detection-settings" open>
      <summary>Peak Detection Settings</summary>
      <div className="detection-settings-body">
        <SmoothingMethodSelect
          value={smoothingMethod}
          onChange={(method) => onCommand({ kind: 'setSmoothingMethod', method })}
        />
        <DomainTable
          domains={domains}
          edits={edits}
          units={units}
          hoveredDomain={hoveredDomain}
          onHoverDomain={onHoverDomain}
          onCommand={onCommand}
        />
      </div>
    </details>
  )
}
