import { useState } from 'react'
import { MessageList } from './components/MessageList'
import { ObjectIdForm } from './components/ObjectIdForm'
import { useSession } from './hooks/useSession'
import { InjectionTable } from './injections/InjectionTable'
import { ChromatogramPlot } from './plot/ChromatogramPlot'
import { PeaksTable } from './table/PeaksTable'

function App() {
  const { state, create, sendCommand, selectDataset } = useSession()
  // The peak under the pointer in the plot or the table, highlighted in both.
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  return (
    <main className="app">
      <h1>Peaks Preview</h1>
      <ObjectIdForm disabled={state.status === 'loading'} onSubmit={create} />

      {state.status === 'loading' && <p className="status">Downloading and analyzing…</p>}
      {state.status === 'failed' && <MessageList messages={state.messages} />}
      {state.status === 'loaded' && (
        <>
          <MessageList messages={[...state.session.messages, ...state.commandErrors]} />
          {state.session.injectionTable && (
            <InjectionTable
              injections={state.session.injectionTable}
              activeDataset={state.session.dataset.index}
              onSelectDataset={(datasetIndex) => {
                // The hovered peak belongs to the dataset being left.
                setHoveredKey(null)
                selectDataset(datasetIndex)
              }}
            />
          )}
          {/* A new key per session gives each one a fresh plot, so a new analysis starts zoomed out.
              Switching datasets keeps the plot, and its zoom, so injections compare at one scale. */}
          <ChromatogramPlot
            key={state.session.sessionId}
            sessionId={state.session.sessionId}
            dataset={state.session.dataset}
            method={state.method}
            hasOtherTraces={state.session.datasets.length > 1 || state.session.injectionTable !== null}
            onCommand={sendCommand}
            hoveredKey={hoveredKey}
            onHoverPeak={setHoveredKey}
          />
          {/* No per-session key here: the chosen columns carry over to the next analysis. */}
          <PeaksTable
            rows={state.session.dataset.table}
            analysis={state.session.dataset.analysis}
            units={{ x: state.session.dataset.xUnits, y: state.session.dataset.yUnits }}
            domains={state.session.dataset.vnextSettings?.domains ?? null}
            hoveredKey={hoveredKey}
            onHoverPeak={setHoveredKey}
          />
        </>
      )}
    </main>
  )
}

export default App
