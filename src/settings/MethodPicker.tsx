import { useId } from 'react'
import { METHOD_LABELS } from '../api/methods'
import type { Method } from '../api/types'

// Threshold is left out until the app can create thresholds; switching to it would show nothing.
const METHODS: Method[] = ['Curvature', 'CurvatureVnext', 'Manual']

type Props = {
  method: Method
  onMethodChange: (method: Method) => void
}

/** Chooses the peak-picking method, labelled "Method". */
export function MethodPicker({ method, onMethodChange }: Props) {
  const id = useId()

  return (
    <div className="setting">
      <label htmlFor={id}>Method</label>
      <select id={id} value={method} onChange={(event) => onMethodChange(event.target.value as Method)}>
        {METHODS.map((m) => (
          <option key={m} value={m}>
            {METHOD_LABELS[m]}
          </option>
        ))}
      </select>
    </div>
  )
}
