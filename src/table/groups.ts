import type { PeakRow } from '../api/types'

/** The rows of one domain's peaks, or of the peaks in no domain when `domain` is `null`. */
export type RowGroup = { domain: number | null; rows: PeakRow[] }

/**
 * The rows grouped by the domain each peak was found in: one group per domain, in the domains'
 * order and kept even when empty, so every domain can be listed. Any peaks in no domain, as when
 * there are no domains at all, come last in a group of their own. Rows keep their order within a
 * group.
 */
export function groupByDomain(rows: readonly PeakRow[], domainCount: number): RowGroup[] {
  const groups: RowGroup[] = Array.from({ length: domainCount }, (_, domain) => ({ domain, rows: [] }))
  const outside: PeakRow[] = []
  for (const row of rows) {
    // A domain the analysis does not list would be a mismatch between the two; keep the peak
    // visible rather than lose it.
    const group = row.domain === null ? undefined : groups[row.domain]
    if (group) group.rows.push(row)
    else outside.push(row)
  }
  return outside.length > 0 ? [...groups, { domain: null, rows: outside }] : groups
}
