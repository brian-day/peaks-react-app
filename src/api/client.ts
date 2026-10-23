import type { ApiMessage, Command, CommandResult, CreatedSession } from './types'

/** A request that failed, with the messages explaining why. */
export class ApiError extends Error {
  readonly messages: ApiMessage[]

  constructor(messages: ApiMessage[]) {
    super(messages.map((m) => m.message).join('\n'))
    this.messages = messages
  }
}

/** Downloads and analyzes an `Object[Data, Chromatography]`, starting a session for it. */
export function createSession(objectId: string): Promise<CreatedSession> {
  return post('/api/sessions', { objectId })
}

/** Applies one edit to a session's analysis. */
export function applyCommand(sessionId: string, command: Command): Promise<CommandResult> {
  return post(`/api/sessions/${sessionId}/commands`, command)
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (response.ok) {
    return response.json()
  }

  // peaks_server explains every error as `{ messages }`. Anything else means something other
  // than peaks_server answered, most likely Vite's proxy because the server is not running.
  const errorBody: { messages?: ApiMessage[] } | null = await response.json().catch(() => null)
  if (errorBody?.messages) {
    throw new ApiError(errorBody.messages)
  }
  throw new ApiError([
    {
      level: 'Error',
      message: `peaks_server responded ${response.status} ${response.statusText}. Is it running?`,
    },
  ])
}
