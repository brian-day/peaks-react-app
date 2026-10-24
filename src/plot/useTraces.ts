import { useEffect, useState } from 'react'
import { ApiError, getTraces } from '../api/client'
import type { ApiMessage, InjectionTrace } from '../api/types'

type TracesResult = { traces: InjectionTrace[] | null; messages: ApiMessage[] }

/**
 * Fetches every injection's trace the first time they are `wanted`. They never change, so they
 * are fetched once per session and kept.
 */
export function useTraces(sessionId: string, wanted: boolean): TracesResult {
  const [result, setResult] = useState<TracesResult>({ traces: null, messages: [] })
  const fetched = result.traces !== null

  useEffect(() => {
    if (!wanted || fetched) return

    const controller = new AbortController()
    getTraces(sessionId, controller.signal).then(
      ({ traces, warnings }) =>
        setResult({ traces, messages: warnings.map((message) => ({ level: 'Warning', message })) }),
      (error: unknown) => {
        if (controller.signal.aborted) return
        const messages = error instanceof ApiError ? error.messages : [{ level: 'Error' as const, message: String(error) }]
        setResult({ traces: null, messages })
      },
    )
    return () => controller.abort()
  }, [sessionId, wanted, fetched])

  return result
}
