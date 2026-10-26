import { useState } from 'react'
import type { Command, DomainSettings } from '../api/types'
import { ButtonGroup } from '../components/ButtonGroup'
import { hasGaps, snapDomains, type Snap } from './domains'

const SNAPS: { snap: Snap; label: string; hint: string }[] = [
  { snap: 'left', label: 'Left', hint: 'Start each domain where the one before it ends' },
  { snap: 'right', label: 'Right', hint: 'End each domain where the one after it starts' },
  { snap: 'center', label: 'Center', hint: 'Meet halfway across each gap' },
]

type Props = {
  domains: DomainSettings[]
  onCommand: (command: Command) => Promise<void>
}

/**
 * Edits Curvature (vnext)'s domains all at once: closes the gaps between them, so that peaks are
 * detected everywhere from the first domain's start to the last domain's end.
 */
export function DomainToolbar({ domains, onCommand }: Props) {
  const [busy, setBusy] = useState(false)

  async function snap(direction: Snap) {
    setBusy(true)
    try {
      // The analysis edits one domain's range at a time. Each edit only grows a domain into a gap,
      // so no two domains overlap along the way, whatever the order.
      const ranges = snapDomains(domains, direction)
      for (const [domainIndex, [start, end]] of ranges.entries()) {
        const domain = domains[domainIndex]
        if (start !== domain.start || end !== domain.end) {
          await onCommand({ kind: 'setDomainRange', domainIndex, start, end })
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const gaps = hasGaps(domains)
  return (
    <ButtonGroup label="Snap Domains">
      {SNAPS.map(({ snap: direction, label, hint }) => (
        <button
          key={direction}
          type="button"
          title={gaps ? hint : 'There are no gaps between the domains to close'}
          disabled={busy || !gaps}
          onClick={() => void snap(direction)}
        >
          {label}
        </button>
      ))}
    </ButtonGroup>
  )
}
