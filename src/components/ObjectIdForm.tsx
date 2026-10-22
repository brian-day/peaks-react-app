import { useState } from 'react'

// A chromatography data object on stage, so there is something to analyze straight away.
const EXAMPLE_OBJECT_ID = 'id:M8n3rxPqa87E'

type Props = {
  disabled: boolean
  onSubmit: (objectId: string) => void
}

export function ObjectIdForm({ disabled, onSubmit }: Props) {
  const [objectId, setObjectId] = useState(EXAMPLE_OBJECT_ID)
  const trimmed = objectId.trim()

  return (
    <form
      className="object-id-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(trimmed)
      }}
    >
      <label>
        Object[Data, Chromatography]
        <input value={objectId} onChange={(event) => setObjectId(event.target.value)} />
      </label>
      <button type="submit" disabled={disabled || trimmed === ''}>
        Analyze
      </button>
    </form>
  )
}
