import { useState } from 'react'
import type { ObjectType } from '../api/types'

// A chromatography data object on stage, so there is something to analyze straight away.
const EXAMPLE_OBJECT_ID = 'id:M8n3rxPqa87E'

const OBJECT_TYPES: ObjectType[] = ['Object[Data, Chromatography]', 'Object[Protocol, HPLC]', 'Object[Protocol, FPLC]']

type Props = {
  disabled: boolean
  onSubmit: (objectType: ObjectType, objectId: string) => void
}

/** Chooses what to analyze: an object's type and ID. The server needs the type to download it. */
export function ObjectIdForm({ disabled, onSubmit }: Props) {
  const [objectType, setObjectType] = useState<ObjectType>(OBJECT_TYPES[0])
  const [objectId, setObjectId] = useState(EXAMPLE_OBJECT_ID)
  const trimmed = objectId.trim()

  return (
    <form
      className="object-id-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(objectType, trimmed)
      }}
    >
      <label>
        Type
        <select value={objectType} onChange={(event) => setObjectType(event.target.value as ObjectType)}>
          {OBJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label>
        ID
        <input value={objectId} onChange={(event) => setObjectId(event.target.value)} />
      </label>
      <button type="submit" disabled={disabled || trimmed === ''}>
        Analyze
      </button>
    </form>
  )
}
