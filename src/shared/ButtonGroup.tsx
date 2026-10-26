type Props = {
  label: string
  children: React.ReactNode
}

/** A row of joined buttons under a small label. */
export function ButtonGroup({ label, children }: Props) {
  return (
    <div className="button-group" role="group" aria-label={label}>
      <span className="button-group-label">{label}</span>
      {children}
    </div>
  )
}
