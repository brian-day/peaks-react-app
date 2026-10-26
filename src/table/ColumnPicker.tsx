import { useEffect, useRef } from 'react'
import { COLUMNS, DEFAULT_COLUMNS, type TableColumnKey } from './columns'

type Props = {
  shown: ReadonlySet<TableColumnKey>
  onChange: (shown: Set<TableColumnKey>) => void
}

/**
 * A menu of checkboxes choosing which columns the table shows. Built on `<details>`, which handles
 * opening, closing and the keyboard; clicking elsewhere also closes it.
 */
export function ColumnPicker({ shown, onChange }: Props) {
  const ref = useRef<HTMLDetailsElement>(null)

  // The capture phase sees the press even if something else, such as the plot, stops it.
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
          Reset to Defaults
        </button>
      </div>
    </details>
  )
}
