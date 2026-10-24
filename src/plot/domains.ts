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

/**
 * How far domain `index`'s ends can be dragged: its start down to where the domain before it
 * ends, and its end up to where the domain after it starts, so that domains never overlap.
 * Domains are in order of their start.
 */
export function neighbourLimits(
  domains: readonly { start: number; end: number }[],
  index: number,
): [min: number, max: number] {
  return [domains[index - 1]?.end ?? -Infinity, domains[index + 1]?.start ?? Infinity]
}
