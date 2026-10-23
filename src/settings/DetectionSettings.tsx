import { useId } from 'react'
import type { Command, CurvatureSettings, SmoothingMethod } from '../api/types'
import { NumberField } from './NumberField'

type Props = {
  settings: CurvatureSettings
  units: { x: string; y: string }
  onCommand: (command: Command) => Promise<void>
}

const SMOOTHING_METHODS: { method: SmoothingMethod; label: string }[] = [
  { method: 'Gaussian', label: 'Gaussian' },
  { method: 'SavitzkyGolay', label: 'Savitzky–Golay' },
]

/**
 * The Curvature method's peak detection settings, in the groups each reset covers. Every change
 * re-runs the detection, and the peaks, table and −y'' follow.
 */
export function DetectionSettings({ settings, units, onCommand }: Props) {
  const s = settings
  const methodId = useId()

  return (
    <div className="detection-settings">
      <fieldset>
        <legend>Detection</legend>
        <div className="setting">
          <label htmlFor={methodId}>Smoothing</label>
          <select
            id={methodId}
            value={s.smoothingMethod}
            onChange={(event) =>
              onCommand({ kind: 'setSmoothingMethod', method: event.target.value as SmoothingMethod })
            }
          >
            {SMOOTHING_METHODS.map(({ method, label }) => (
              <option key={method} value={method}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="setting">
          <NumberField
            label="Width"
            value={s.smoothing}
            units={units.x}
            onCommit={(value) => onCommand({ kind: 'setSmoothing', value })}
          />
          <AutoButton onClick={() => onCommand({ kind: 'setSmoothing', value: null })} />
        </div>
        <div className="setting">
          <NumberField
            label="Threshold"
            value={s.thresholdHeight}
            units={`${units.y}/${units.x}²`}
            onCommit={(value) => onCommand({ kind: 'setThresholdHeight', value })}
          />
          <AutoButton onClick={() => onCommand({ kind: 'setThresholdHeight', value: null })} />
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
        <ResetButton
          label="Reset all"
          // dva_lib's detection reset returns every curvature setting to its default, not only
          // this group's, so the button says so.
          title="Return every detection, baseline and exclusion setting to its default"
          onClick={() => onCommand({ kind: 'resetDetection' })}
        />
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
        <ResetButton label="Reset" onClick={() => onCommand({ kind: 'resetLiftOffTouchDown' })} />
      </fieldset>

      <fieldset>
        <legend>Exclude peaks below</legend>
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
        <ResetButton label="Reset" onClick={() => onCommand({ kind: 'resetMinimumPeakSize' })} />
      </fieldset>
    </div>
  )
}

function AutoButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="auto-button" title="Let the analysis choose this value" onClick={onClick}>
      Auto
    </button>
  )
}

function ResetButton({ label, title, onClick }: { label: string; title?: string; onClick: () => void }) {
  return (
    <button type="button" className="reset-button" title={title} onClick={onClick}>
      {label}
    </button>
  )
}
