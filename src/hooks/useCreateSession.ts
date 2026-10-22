import { useCallback, useState } from 'react'
import { ApiError, createSession } from '../api/client'
import type { ApiMessage, CreatedSession } from '../api/types'

export type SessionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; session: CreatedSession }
  | { status: 'failed'; messages: ApiMessage[] }

/** Tracks a request to start a session, from sending it to its result. */
export function useCreateSession() {
  const [state, setState] = useState<SessionState>({ status: 'idle' })

  const create = useCallback(async (objectId: string) => {
    setState({ status: 'loading' })
    try {
      setState({ status: 'loaded', session: await createSession(objectId) })
    } catch (error) {
      const messages =
        error instanceof ApiError ? error.messages : [{ level: 'Error' as const, message: String(error) }]
      setState({ status: 'failed', messages })
    }
  }, [])

  return { state, create }
}
