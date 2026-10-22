import type { ApiMessage, CreatedSession } from './types'

/** A request that failed, with the messages explaining why. */
export class ApiError extends Error {
  readonly messages: ApiMessage[]

  constructor(messages: ApiMessage[]) {
    super(messages.map((m) => m.message).join('\n'))
    this.messages = messages
  }
}

/** Downloads and analyzes an `Object[Data, Chromatography]`, starting a session for it. */
export async function createSession(objectId: string): Promise<CreatedSession> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectId }),
  })

  if (response.ok) {
    return response.json()
  }

  // 422 means the analysis itself failed, and the server says why.
  if (response.status === 422) {
    const body: { messages: ApiMessage[] } = await response.json()
    throw new ApiError(body.messages)
  }

  throw new ApiError([
    {
      level: 'Error',
      message: `peaks_server responded ${response.status} ${response.statusText}. Is it running?`,
    },
  ])
}
