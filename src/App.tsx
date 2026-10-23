import { MessageList } from './components/MessageList'
import { ObjectIdForm } from './components/ObjectIdForm'
import { useSession } from './hooks/useSession'
import { ChromatogramPlot } from './plot/ChromatogramPlot'
import { PeaksTable } from './table/PeaksTable'

function App() {
  const { state, create, sendCommand } = useSession()

  return (
    <main className="app">
      <h1>Peaks Preview</h1>
      <ObjectIdForm disabled={state.status === 'loading'} onSubmit={create} />

      {state.status === 'loading' && <p className="status">Downloading and analyzing…</p>}
      {state.status === 'failed' && <MessageList messages={state.messages} />}
      {state.status === 'loaded' && (
        <>
          <MessageList messages={[...state.session.messages, ...state.commandErrors]} />
          {/* A new key per session gives each one a fresh plot, so a new analysis starts zoomed out. */}
          <ChromatogramPlot
            key={state.session.sessionId}
            dataset={state.session.dataset}
            method={state.method}
            onCommand={sendCommand}
          />
          {/* No per-session key here: the chosen columns carry over to the next analysis. */}
          <PeaksTable
            rows={state.session.dataset.table}
            analysis={state.session.dataset.analysis}
            units={{ x: state.session.dataset.xUnits, y: state.session.dataset.yUnits }}
          />
        </>
      )}
    </main>
  )
}

export default App
