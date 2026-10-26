import { useState } from 'react'
import type { Command, CreatedSession, Method } from './api/types'
import { InjectionTable } from './injections/InjectionTable'
import { ChromatogramPlot } from './plot/ChromatogramPlot'
import { DetectionSettings } from './settings/DetectionSettings'
import { curvatureDetection } from './settings/domainEdits'

type Props = {
  session: CreatedSession
  method: Method
  /** Sends an edit to the analysis, resolving once it has been applied or has failed. */
  onCommand: (command: Command) => Promise<void>
  /** Shows another of the session's datasets. */
  onSelectDataset: (datasetIndex: number) => void
  /** The peak to highlight in the plot, whether hovered there or in the peaks table. */
  hoveredKey: string | null
  onHoverPeak: (key: string | null) => void
}

/**
 * One analysis session: a protocol's injections, the active dataset's detection settings, and its
 * plot.
 *
 * Give it a new `key` for each session, so that everything in it starts over: the zoom, what the
 * plot shows, the other injections' traces, and anything half-dragged or half-typed. Switching
 * datasets keeps it all, so injections compare at one scale.
 */
export function SessionView({ session, method, onCommand, onSelectDataset, hoveredKey, onHoverPeak }: Props) {
  const { dataset } = session
  // The domain hovered in the domain table or on the plot, highlighted in both.
  const [hoveredDomain, setHoveredDomain] = useState<number | null>(null)

  return (
    <div className="session-view">
      {session.injectionTable && (
        <InjectionTable
          injections={session.injectionTable}
          activeDataset={dataset.index}
          onSelectDataset={onSelectDataset}
        />
      )}
      <DetectionSettings
        method={method}
        onMethodChange={(newMethod) => void onCommand({ kind: 'setMethod', method: newMethod })}
        curvature={curvatureDetection(dataset)}
        units={{ x: dataset.xUnits, y: dataset.yUnits }}
        hoveredDomain={hoveredDomain}
        onHoverDomain={setHoveredDomain}
        onCommand={onCommand}
      />
      <ChromatogramPlot
        sessionId={session.sessionId}
        dataset={dataset}
        method={method}
        hasOtherTraces={session.datasets.length > 1 || session.injectionTable !== null}
        onCommand={onCommand}
        hoveredKey={hoveredKey}
        onHoverPeak={onHoverPeak}
        hoveredDomain={hoveredDomain}
        onHoverDomain={setHoveredDomain}
      />
    </div>
  )
}
