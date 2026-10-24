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

/** Which way the domains move to close the gaps between them. */
export type Snap = 'left' | 'right' | 'center'

/**
 * The domains' ranges with the gaps between neighbours closed: each gap's right-hand domain
 * starts where the left-hand one ends (`left`), the left-hand one ends where the right-hand one
 * starts (`right`), or both meet halfway across the gap (`center`). The first domain's start and
 * the last domain's end stay where they are. Domains are in order of their start.
 */
export function snapDomains(
  domains: readonly { start: number; end: number }[],
  snap: Snap,
): [start: number, end: number][] {
  // Where the domains either side of a gap meet.
  const join = (left: { end: number }, right: { start: number }) => {
    switch (snap) {
      case 'left':
        return left.end
      case 'right':
        return right.start
      case 'center':
        return (left.end + right.start) / 2
    }
  }
  return domains.map((domain, index) => {
    const before = domains[index - 1]
    const after = domains[index + 1]
    return [before ? join(before, domain) : domain.start, after ? join(domain, after) : domain.end]
  })
}

/** Whether any domain ends before the next one starts. Domains are in order of their start. */
export function hasGaps(domains: readonly { start: number; end: number }[]): boolean {
  return domains.some((domain, index) => index > 0 && domains[index - 1].end < domain.start)
}
