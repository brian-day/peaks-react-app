import type { XY } from '../api/types'

/**
 * The stretches of a curve within each domain, in the domains' order, leaving out the gaps
 * between them, where nothing is detected. With no domains, as outside Curvature (vnext), the
 * whole curve is one stretch.
 */
export function withinDomains(
  points: readonly XY[],
  domains: readonly (readonly [start: number, end: number])[] | null,
): XY[][] {
  if (!domains) return [[...points]]
  return domains
    .map(([start, end]) => points.filter(([x]) => x >= start && x <= end))
    .filter((stretch) => stretch.length > 0)
}
