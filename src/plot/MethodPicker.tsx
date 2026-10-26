import { METHOD_LABELS } from '../api/methods'
import type { Method } from '../api/types'
import { ButtonGroup } from '../components/ButtonGroup'

// Threshold is left out until the app can create thresholds; switching to it would show nothing.
const METHODS: Method[] = ['Curvature', 'CurvatureVnext', 'Manual']

type Props = {
  method: Method
  onMethodChange: (method: Method) => void
}

/** Chooses the peak-picking method. */
export function MethodPicker({ method, onMethodChange }: Props) {
  return (
    <ButtonGroup label="Method">
      {METHODS.map((m) => (
        <button key={m} type="button" aria-pressed={m === method} onClick={() => onMethodChange(m)}>
          {METHOD_LABELS[m]}
        </button>
      ))}
    </ButtonGroup>
  )
}
