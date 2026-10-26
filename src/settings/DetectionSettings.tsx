import type { Command, DomainSettings, Method, SmoothingMethod } from '../api/types'
import { DomainTable } from './DomainTable'
import type { DomainEdits } from './domainEdits'
import { MethodPicker } from './MethodPicker'
import { SmoothingMethodSelect } from './SmoothingMethodSelect'

/** A Curvature method's settings, as domains. */
export type CurvatureDetection = {
  /** Shared by every domain. */
  smoothingMethod: SmoothingMethod
  domains: DomainSettings[]
  /** The commands the table's edits send, for whichever Curvature method is active. */
  edits: DomainEdits
}

type Props = {
  method: Method
  onMethodChange: (method: Method) => void
  /** The active Curvature method's settings, or null under a method without any. */
  curvature: CurvatureDetection | null
  units: { x: string; y: string }
  /** The domain whose row to highlight, by its index. */
  hoveredDomain: number | null
  onHoverDomain: (domainIndex: number | null) => void
  onCommand: (command: Command) => Promise<void>
}

/**
 * How peaks are detected: the peak-picking method and, under the Curvature methods, the smoothing
 * method every domain shares, then each domain's own settings. The Curvature method has one domain,
 * its threshold's range. Every change re-runs the detection, and the peaks, table and −y'' follow.
 */
export function DetectionSettings({
  method,
  onMethodChange,
  curvature,
  units,
  hoveredDomain,
  onHoverDomain,
  onCommand,
}: Props) {
  return (
    <details className="detection-settings" open>
      <summary>Peak Detection Settings</summary>
      <div className="detection-settings-body">
        <div className="detection-settings-row">
          <MethodPicker method={method} onMethodChange={onMethodChange} />
          {curvature && (
            <SmoothingMethodSelect
              value={curvature.smoothingMethod}
              onChange={(smoothingMethod) => onCommand({ kind: 'setSmoothingMethod', method: smoothingMethod })}
            />
          )}
        </div>
        {curvature && (
          <DomainTable
            domains={curvature.domains}
            edits={curvature.edits}
            units={units}
            hoveredDomain={hoveredDomain}
            onHoverDomain={onHoverDomain}
            onCommand={onCommand}
          />
        )}
      </div>
    </details>
  )
}
