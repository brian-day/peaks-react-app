import { COLUMNS, DEFAULT_COLUMNS, type TableColumnKey } from './columns'

type Props = {
  shown: ReadonlySet<TableColumnKey>
  onChange: (shown: Set<TableColumnKey>) => void
}

/**
 * A menu of checkboxes choosing which columns the table shows.
 *
 * Built on `<details>`, which opens and closes itself and is keyboard-accessible without any
 * script of ours.
 */
export function ColumnPicker({ shown, onChange }: Props) {
  function toggle(key: TableColumnKey) {
    const next = new Set(shown)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(next)
  }

  return (
    <details className="column-picker">
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
