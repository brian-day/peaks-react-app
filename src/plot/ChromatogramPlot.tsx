import { useState } from 'react'
import { addModeFor, hasSecondDerivative } from '../api/methods'
import type { Command, DatasetSnapshot, Method } from '../api/types'
import { MessageList } from '../components/MessageList'
import { DomainToolbar } from './DomainToolbar'
import type { Mode } from './InteractionLayer'
import { PlotCanvas } from './PlotCanvas'
import { PlotToolbar } from './PlotToolbar'
import { useOverlays } from './useOverlays'
import { useTraces } from './useTraces'

type Props = {
  sessionId: string
  dataset: DatasetSnapshot
  method: Method
  /** Whether the session has traces other than this dataset's, as a protocol does. */
  hasOtherTraces: boolean
  /** Sends an edit to the analysis, resolving once it has been applied or has failed. */
  onCommand: (command: Command) => Promise<void>
  /** The {@link peakKey} of the peak to highlight, whether hovered here or elsewhere. */
  hoveredKey: string | null
  /** Called with the peak under the pointer as it moves over the plot, or `null`. */
  onHoverPeak: (key: string | null) => void
  /** The domain whose threshold bar to highlight, by its index, whether hovered here or elsewhere. */
  hoveredDomain: number | null
  /** Called with the domain whose threshold bar the pointer is over, or `null`. */
  onHoverDomain: (domainIndex: number | null) => void
}

/**
 * A dataset's plot with its toolbar, which chooses what dragging across the plot does and what is
 * drawn on it. Fetches the curves that are drawn only on request, −y'' and the other injections'
 * traces, while they are shown. See {@link PlotCanvas} for the plot itself.
 */
export function ChromatogramPlot({
  sessionId,
  dataset,
  method,
  hasOtherTraces,
  onCommand,
  hoveredKey,
  onHoverPeak,
  hoveredDomain,
  onHoverDomain,
}: Props) {
  const [chosenMode, setMode] = useState<Mode>('zoom')
  // Switching to a method that cannot add what the mode adds leaves dragging to zoom again.
  const addMode = addModeFor(method)
  const mode = (chosenMode === 'addPeak' || chosenMode === 'addDomain') && chosenMode !== addMode ? 'zoom' : chosenMode

  // −y'' only exists under the Curvature methods. The choice is kept while another method is active,
  // so the curve comes back on returning to one.
  const [chosenSecondDerivative, setChosenSecondDerivative] = useState(false)
  // Hiding the trace hides the peaks drawn on it too, leaving −y'' and its threshold to read on
  // their own. The table still lists the peaks.
  const [showTrace, setShowTrace] = useState(true)
  // The domains' boundaries are shown from the start, so a domain just added can be seen.
  const [chosenDomains, setChosenDomains] = useState(true)
  const showDomains = hasSecondDerivative(method) && chosenDomains
  const showSecondDerivative = hasSecondDerivative(method) && chosenSecondDerivative
  // The other injections' traces, fetched the first time they are shown.
  const [chosenOtherTraces, setChosenOtherTraces] = useState(false)
  const showOtherTraces = hasOtherTraces && chosenOtherTraces
  const { traces: otherTraces, messages: otherTraceMessages } = useTraces(sessionId, showOtherTraces)
  const { overlays, errors: overlayErrors } = useOverlays(sessionId, showSecondDerivative, dataset.analysis)

  return (
    <div className="plot-panel">
      <PlotToolbar
        method={method}
        mode={mode}
        onModeChange={setMode}
        trace={showTrace}
        onTraceChange={setShowTrace}
        secondDerivative={chosenSecondDerivative}
        onSecondDerivativeChange={setChosenSecondDerivative}
        domains={chosenDomains}
        onDomainsChange={setChosenDomains}
        hasOtherTraces={hasOtherTraces}
        otherTraces={chosenOtherTraces}
        onOtherTracesChange={setChosenOtherTraces}
      >
        {method === 'CurvatureVnext' && dataset.vnextSettings && (
          <DomainToolbar domains={dataset.vnextSettings.domains} onCommand={onCommand} />
        )}
      </PlotToolbar>
      {/* Below the toolbar, so a new message can't shift the buttons under the pointer. */}
      <MessageList messages={[...overlayErrors, ...(showOtherTraces ? otherTraceMessages : [])]} />
      <PlotCanvas
        dataset={dataset}
        mode={mode}
        addMode={addMode}
        showTrace={showTrace}
        showSecondDerivative={showSecondDerivative}
        showDomains={showDomains}
        overlays={overlays}
        otherTraces={showOtherTraces ? otherTraces : null}
        onCommand={onCommand}
        hoveredKey={hoveredKey}
        onHoverPeak={onHoverPeak}
        hoveredDomain={hoveredDomain}
        onHoverDomain={onHoverDomain}
      />
    </div>
  )
}
