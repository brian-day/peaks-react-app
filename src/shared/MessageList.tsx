import type { ApiMessage } from '../api/types'

type Props = {
  messages: ApiMessage[]
}

export function MessageList({ messages }: Props) {
  if (messages.length === 0) return null

  return (
    <ul className="messages">
      {messages.map((m, index) => (
        <li key={index} className={`message message--${m.level.toLowerCase()}`}>
          {m.message}
        </li>
      ))}
    </ul>
  )
}
