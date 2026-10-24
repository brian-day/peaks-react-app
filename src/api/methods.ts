import type { AddMode } from '../plot/InteractionLayer'
import type { Method } from './types'

/** Each method as the user sees it named. */
export const METHOD_LABELS: Record<Method, string> = {
  Manual: 'Manual',
  Threshold: 'Threshold',
  Curvature: 'Curvature',
  CurvatureVnext: 'Curvature (vnext)',
}

/** Whether the method detects peaks from −y'', and so has a −y'' curve to show. */
export function hasSecondDerivative(method: Method): boolean {
  return method === 'Curvature' || method === 'CurvatureVnext'
}

/** What dragging across the plot can add under the method: peaks under Manual, domains under Curvature (vnext). */
export function addModeFor(method: Method): AddMode | null {
  switch (method) {
    case 'Manual':
      return 'addPeak'
    case 'CurvatureVnext':
      return 'addDomain'
    default:
      return null
  }
}
