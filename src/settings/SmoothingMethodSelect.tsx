import { useId } from 'react'
import type { SmoothingMethod } from '../api/types'

const SMOOTHING_METHODS: { method: SmoothingMethod; label: string }[] = [
  { method: 'Gaussian', label: 'Gaussian' },
  { method: 'SavitzkyGolay', label: 'Savitzky–Golay' },
]

type Props = {
  value: SmoothingMethod
  onChange: (method: SmoothingMethod) => void
}

/** The filter that smooths the data for its derivatives, labelled "Smoothing". */
export function SmoothingMethodSelect({ value, onChange }: Props) {
  const id = useId()

  return (
    <div className="setting">
      <label htmlFor={id}>Smoothing</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value as SmoothingMethod)}>
        {SMOOTHING_METHODS.map(({ method, label }) => (
          <option key={method} value={method}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
