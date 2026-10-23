import { useCallback, useState } from 'react'
import { ApiError, applyCommand, createSession } from '../api/client'
import type { ApiMessage, Command, CreatedSession, Method } from '../api/types'

export type SessionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'failed'; messages: ApiMessage[] }
  | {
      status: 'loaded'
      session: CreatedSession
      method: Method
      /** Why the most recent edit failed; empty once one succeeds. */
      commandErrors: ApiMessage[]
    }

// peaks_server builds every analysis with default options, and the default method is Curvature.
const INITIAL_METHOD: Method = 'Curvature'

/** Starts an analysis session, and edits it once started. */
export function useSession() {
  const [state, setState] = useState<SessionState>({ status: 'idle' })

  const create = useCallback(async (objectId: string) => {
    setState({ status: 'loading' })
    try {
      const session = await createSession(objectId)
      setState({ status: 'loaded', session, method: INITIAL_METHOD, commandErrors: [] })
    } catch (error) {
      setState({ status: 'failed', messages: toMessages(error) })
    }
  }, [])

  const sessionId = state.status === 'loaded' ? state.session.sessionId : null

  /** Sends an edit and shows the analysis it produces. Never throws; failures land in `commandErrors`. */
  const sendCommand = useCallback(
    async (command: Command) => {
      if (sessionId === null) return

      // Each update checks the session is still the one the edit was sent to, in case a new
      // analysis was started while the edit was on its way.
      try {
        const { analysis } = await applyCommand(sessionId, command)
        setState((current) =>
          current.status === 'loaded' && current.session.sessionId === sessionId
            ? {
                ...current,
                session: { ...current.session, dataset: { ...current.session.dataset, analysis } },
                method: command.kind === 'setMethod' ? command.method : current.method,
                commandErrors: [],
              }
            : current,
        )
      } catch (error) {
        setState((current) =>
          current.status === 'loaded' && current.session.sessionId === sessionId
            ? { ...current, commandErrors: toMessages(error) }
            : current,
        )
      }
    },
    [sessionId],
  )

  return { state, create, sendCommand }
}

function toMessages(error: unknown): ApiMessage[] {
  return error instanceof ApiError ? error.messages : [{ level: 'Error', message: String(error) }]
}
