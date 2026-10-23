import { MessageList } from './components/MessageList'
import { ObjectIdForm } from './components/ObjectIdForm'
import { useCreateSession } from './hooks/useCreateSession'
import { ChromatogramPlot } from './plot/ChromatogramPlot'

function App() {
  const { state, create } = useCreateSession()

  return (
    <main className="app">
      <h1>Peaks Preview</h1>
      <ObjectIdForm disabled={state.status === 'loading'} onSubmit={create} />

      {state.status === 'loading' && <p className="status">Downloading and analyzing…</p>}
      {state.status === 'failed' && <MessageList messages={state.messages} />}
      {state.status === 'loaded' && (
        <>
          <MessageList messages={state.session.messages} />
          {/* A new key per session gives each one a fresh plot, so a new analysis starts zoomed out. */}
          <ChromatogramPlot key={state.session.sessionId} dataset={state.session.dataset} />
        </>
      )}
    </main>
  )
}

export default App
