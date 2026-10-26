import { useEffect, useRef } from 'react'
import { COLUMNS, DEFAULT_COLUMNS, type TableColumnKey } from './columns'

type Props = {
  shown: ReadonlySet<TableColumnKey>
  onChange: (shown: Set<TableColumnKey>) => void
}

/**
 * A menu of checkboxes choosing which columns the table shows.
 *
 * Built on `<details>`, which opens and closes itself and is keyboard-accessible without any
 * script of ours. The one thing it can't do alone is close when the user clicks elsewhere.
 */
export function ColumnPicker({ shown, onChange }: Props) {
  const ref = useRef<HTMLDetailsElement>(null)

  // Listening in the capture phase sees the press before anything else on the page can stop it,
  // such as the plot starting a drag.
  useEffect(() => {
    function closeIfOutside(event: PointerEvent) {
      const details = ref.current
      if (details?.open && !details.contains(event.target as Node)) details.open = false
    }
    document.addEventListener('pointerdown', closeIfOutside, { capture: true })
    return () => document.removeEventListener('pointerdown', closeIfOutside, { capture: true })
  }, [])

  function toggle(key: TableColumnKey) {
    const next = new Set(shown)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(next)
  }

  return (
    <details ref={ref} className="column-picker">
      <summary>Columns</summary>
      <div className="column-picker-menu">
        {COLUMNS.map(({ key, label, description }) => (
          <label key={key} title={description}>
            <input type="checkbox" checked={shown.has(key)} onChange={() => toggle(key)} />
            {label}
          </label>
        ))}
        <button type="button" onClick={() => onChange(new Set(DEFAULT_COLUMNS))}>
          Reset to defaults
        </button>
      </div>
    </details>
  )
}
