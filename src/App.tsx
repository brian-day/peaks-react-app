import { useState } from 'react'
import { MessageList } from './components/MessageList'
import { ObjectIdForm } from './components/ObjectIdForm'
import { useSession } from './hooks/useSession'
import { SessionView } from './SessionView'
import { PeaksTable } from './table/PeaksTable'

function App() {
  const { state, create, sendCommand, selectDataset } = useSession()
  // The peak under the pointer in the plot or the table, highlighted in both.
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  return (
    <main className="app">
      <h1>Peaks Preview</h1>
      <ObjectIdForm
        disabled={state.status === 'loading'}
        onSubmit={(objectType, objectId) => void create(objectType, objectId)}
      />

      {state.status === 'loading' && <p className="status">Downloading and analyzing…</p>}
      {state.status === 'failed' && <MessageList messages={state.messages} />}
      {state.status === 'loaded' && (
        <>
          <MessageList messages={[...state.session.messages, ...state.commandErrors]} />
          {/* A new key per session starts everything in it over, so a new analysis starts zoomed out. */}
          <SessionView
            key={state.session.sessionId}
            session={state.session}
            method={state.method}
            onCommand={sendCommand}
            onSelectDataset={(datasetIndex) => {
              // The hovered peak belongs to the dataset being left.
              setHoveredKey(null)
              void selectDataset(datasetIndex)
            }}
            hoveredKey={hoveredKey}
            onHoverPeak={setHoveredKey}
          />
          {/* Outside the session's key: the chosen columns carry over to the next analysis. */}
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
