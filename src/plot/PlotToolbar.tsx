import type { ReactNode } from 'react'
import { addModeFor, hasSecondDerivative } from '../api/methods'
import type { Method } from '../api/types'
import { ButtonGroup } from '../components/ButtonGroup'
import type { Mode } from './InteractionLayer'

const MODES: { mode: Mode; label: string; hint: string }[] = [
  { mode: 'zoom', label: 'Zoom', hint: 'Drag a box to zoom in; double-click to zoom out' },
  { mode: 'pan', label: 'Pan', hint: 'Drag to pan, or hold Shift in any mode' },
  { mode: 'addPeak', label: 'Add Peak', hint: 'Drag across a peak to add it, or hold Alt (Option) in any mode' },
  {
    mode: 'addDomain',
    label: 'Add Domain',
    hint: 'Drag across a stretch outside the domains to detect peaks there too, or hold Alt (Option) in any mode',
  },
]

type Props = {
  /** Which adding mode and which curves there are to choose from depend on the method. */
  method: Method
  mode: Mode
  onModeChange: (mode: Mode) => void
  trace: boolean
  onTraceChange: (shown: boolean) => void
  secondDerivative: boolean
  onSecondDerivativeChange: (shown: boolean) => void
  domains: boolean
  onDomainsChange: (shown: boolean) => void
  /** Whether there are other traces to show, as there are for a protocol; hides their toggle if not. */
  hasOtherTraces: boolean
  otherTraces: boolean
  onOtherTracesChange: (shown: boolean) => void
  /** Further groups for the same row, such as the method's own tools. */
  children?: ReactNode
}

/**
 * Chooses what dragging across the plot does and what is drawn: the trace, under the Curvature
 * methods −y'' and the boundaries of the domains peaks are detected in, and the other injections'
 * traces.
 */
export function PlotToolbar({
  method,
  mode,
  onModeChange,
  trace,
  onTraceChange,
  secondDerivative,
  onSecondDerivativeChange,
  domains,
  onDomainsChange,
  hasOtherTraces,
  otherTraces,
  onOtherTracesChange,
  children,
}: Props) {
  return (
    <div className="plot-toolbar">
      <ButtonGroup label="Drag To">
        {MODES
          // Each adding mode only means something under its own method, so it is shown only there.
          .filter(({ mode: m }) => (m !== 'addPeak' && m !== 'addDomain') || m === addModeFor(method))
          .map(({ mode: m, label, hint }) => (
            <button key={m} type="button" title={hint} aria-pressed={m === mode} onClick={() => onModeChange(m)}>
              {label}
            </button>
          ))}
      </ButtonGroup>
      <ButtonGroup label="Show">
        {/* Each swatch doubles as its curve's legend. */}
        <button
          type="button"
          title="The data and the peaks found in it; the table still lists the peaks while they are hidden"
          aria-pressed={trace}
          onClick={() => onTraceChange(!trace)}
        >
          <span className="swatch swatch--trace" aria-hidden="true" />
          Trace
        </button>
        {hasSecondDerivative(method) && (
          <button
            type="button"
            title="The negative second derivative of the smoothed data, on the right-hand axis; its bumps are the peaks"
            aria-pressed={secondDerivative}
            onClick={() => onSecondDerivativeChange(!secondDerivative)}
          >
            <span className="swatch swatch--second-derivative" aria-hidden="true" />
            −y″
          </button>
        )}
        {hasSecondDerivative(method) && (
          <button
            type="button"
            title="Where each domain starts and ends; drag a boundary to move it"
            aria-pressed={domains}
            onClick={() => onDomainsChange(!domains)}
          >
            <span className="swatch swatch--domains" aria-hidden="true" />
            Domains
          </button>
        )}
        {hasOtherTraces && (
          <button
            type="button"
            title="The other injections' traces, faintly behind this one, to compare it with"
            aria-pressed={otherTraces}
            onClick={() => onOtherTracesChange(!otherTraces)}
          >
            <span className="swatch swatch--other-traces" aria-hidden="true" />
            Other Traces
          </button>
        )}
      </ButtonGroup>
      {children}
    </div>
  )
}
