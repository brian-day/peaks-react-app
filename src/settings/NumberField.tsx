import { useId, useState } from 'react'
import { formatNumber, parseNumber } from '../shared/format'

type Props = {
  label: string
  value: number
  units?: string | null
  /** Keeps the label for screen readers but hides it, where a column header already names it. */
  hideLabel?: boolean
  /** Called with the new value on Enter or on leaving the field, if it changed and is a number. */
  onCommit: (value: number) => void
}

/**
 * A labelled number that is only sent once the user has finished typing it.
 *
 * Each value it sends re-runs the peak detection, so it waits for Enter or for the user to leave
 * the field rather than sending every keystroke. Escape puts back the value in effect.
 */
export function NumberField({ label, value, units, hideLabel, onCommit }: Props) {
  const id = useId()
  // What the user has typed, or `null` while not editing, when the value in effect is shown.
  const [draft, setDraft] = useState<string | null>(null)

  function commit() {
    if (draft === null) return
    const typed = parseNumber(draft)
    if (typed !== null && typed !== value) onCommit(typed)
    setDraft(null)
  }

  return (
    <div className="number-field">
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : undefined}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={draft ?? formatNumber(value)}
        aria-invalid={draft !== null && parseNumber(draft) === null}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') setDraft(null)
        }}
      />
      {units && <span className="units">{units}</span>}
    </div>
  )
}
