import { useEffect, useState } from 'react'
import { ApiError, getOverlays } from '../api/client'
import type { AnalysisView, ApiMessage, Overlays } from '../api/types'

type OverlaysResult = { overlays: Overlays | null; errors: ApiMessage[] }

/**
 * Fetches the curvature overlays while `wanted`, and fetches them again whenever `analysis`
 * changes, since an edit to the analysis can change them.
 *
 * The last overlays fetched stay until new ones arrive, so a curve does not blink out of view
 * while it is fetched again.
 */
export function useOverlays(sessionId: string, wanted: boolean, analysis: AnalysisView): OverlaysResult {
  const [result, setResult] = useState<OverlaysResult>({ overlays: null, errors: [] })

  useEffect(() => {
    if (!wanted) return

    // Abandons this fetch if a newer one supersedes it, so an old reply cannot overwrite a new one.
    const controller = new AbortController()
    getOverlays(sessionId, controller.signal).then(
      (overlays) => setResult({ overlays, errors: [] }),
      (error: unknown) => {
        if (controller.signal.aborted) return
        const errors = error instanceof ApiError ? error.messages : [{ level: 'Error' as const, message: String(error) }]
        setResult((current) => ({ ...current, errors }))
      },
    )
    return () => controller.abort()
    // `analysis` is not read here: it is the signal that the overlays may have changed.
  }, [sessionId, wanted, analysis])

  return result
}
