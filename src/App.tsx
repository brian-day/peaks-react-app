import { MessageList } from './components/MessageList'
import { ObjectIdForm } from './ObjectIdForm'
import { useSession } from './useSession'
import { SessionView } from './SessionView'

function App() {
  const { state, create, sendCommand, selectDataset } = useSession()

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
          {/* A new key per session starts everything in it over. Don't rely on the loading message
              unmounting it in between: this is what resets the session's state. */}
          <SessionView
            key={state.session.sessionId}
            session={state.session}
            method={state.method}
            onCommand={sendCommand}
            onSelectDataset={(datasetIndex) => void selectDataset(datasetIndex)}
          />
        </>
      )}
    </main>
  )
}

export default App
