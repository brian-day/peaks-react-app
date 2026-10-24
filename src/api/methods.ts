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
