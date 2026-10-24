import type { Command, CurvatureSettings } from '../api/types'
import { NumberField } from './NumberField'
import { SmoothingMethodSelect } from './SmoothingMethodSelect'

type Props = {
  settings: CurvatureSettings
  units: { x: string; y: string }
  onCommand: (command: Command) => Promise<void>
}

/**
 * The Curvature method's peak detection settings, grouped by the stage of detection they affect.
 * Every change re-runs the detection, and the peaks, table and −y'' follow.
 */
export function DetectionSettings({ settings, units, onCommand }: Props) {
  const s = settings

  return (
    // One collapsible section for all three groups, so they open and close together and a
    // half-collapsed row cannot leave gaps.
    <details className="detection-settings" open>
      <summary>Peak Detection Settings</summary>
      <div className="detection-settings-groups">
        <fieldset>
          <legend>Detection</legend>
          <SmoothingMethodSelect
            value={s.smoothingMethod}
            onChange={(method) => onCommand({ kind: 'setSmoothingMethod', method })}
          />
          <div className="setting">
            <NumberField
              label="Width"
              value={s.smoothing}
              units={units.x}
              onCommit={(value) => onCommand({ kind: 'setSmoothing', value })}
            />
          </div>
          <div className="setting">
            <NumberField
              label="Threshold"
              value={s.thresholdHeight}
              units={`${units.y}/${units.x}²`}
              onCommit={(value) => onCommand({ kind: 'setThresholdHeight', value })}
            />
          </div>
          <div className="setting">
            <NumberField
              label="From"
              value={s.thresholdStart}
              units={units.x}
              onCommit={(start) => onCommand({ kind: 'setThresholdDomain', start, end: s.thresholdEnd })}
            />
            <NumberField
              label="to"
              value={s.thresholdEnd}
              units={units.x}
              onCommit={(end) => onCommand({ kind: 'setThresholdDomain', start: s.thresholdStart, end })}
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>Baseline</legend>
          <div className="setting">
            <NumberField
              label="Liftoff"
              value={s.liftOffPercent}
              units="%"
              onCommit={(liftOffPercent) =>
                onCommand({ kind: 'setLiftOffTouchDown', liftOffPercent, touchDownPercent: s.touchDownPercent })
              }
            />
            <NumberField
              label="Touchdown"
              value={s.touchDownPercent}
              units="%"
              onCommit={(touchDownPercent) =>
                onCommand({ kind: 'setLiftOffTouchDown', liftOffPercent: s.liftOffPercent, touchDownPercent })
              }
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>Exclusions</legend>
          <div className="setting">
            <NumberField
              label="Area"
              value={s.minArea}
              units={`${units.y}·${units.x}`}
              onCommit={(area) => onCommand({ kind: 'setMinimumPeakSize', area, height: s.minHeight })}
            />
            <NumberField
              label="Height"
              value={s.minHeight}
              units={units.y}
              onCommit={(height) => onCommand({ kind: 'setMinimumPeakSize', area: s.minArea, height })}
            />
          </div>
        </fieldset>
      </div>
    </details>
  )
}
