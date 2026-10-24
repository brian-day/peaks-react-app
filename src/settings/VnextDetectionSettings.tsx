import type { Command, VnextSettings } from '../api/types'
import { DomainTable } from './DomainTable'
import { SmoothingMethodSelect } from './SmoothingMethodSelect'

type Props = {
  settings: VnextSettings
  units: { x: string; y: string }
  onCommand: (command: Command) => Promise<void>
}

/**
 * Curvature (vnext)'s peak detection settings: the smoothing method every domain shares, then each
 * domain's own settings, its smoothing width among them. Every change re-runs the detection, and
 * the peaks, table and −y'' follow.
 */
export function VnextDetectionSettings({ settings, units, onCommand }: Props) {
  return (
    // Collapses as the Curvature method's settings do, so switching between them feels the same.
    <details className="detection-settings" open>
      <summary>Peak Detection Settings</summary>
      <div className="vnext-settings">
        <SmoothingMethodSelect
          value={settings.smoothingMethod}
          onChange={(method) => onCommand({ kind: 'setSmoothingMethod', method })}
        />
        <DomainTable domains={settings.domains} units={units} onCommand={onCommand} />
      </div>
    </details>
  )
}
