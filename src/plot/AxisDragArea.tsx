import { useState, type PointerEvent } from 'react'
import { pan, type Domain } from './viewport'

type Props = {
  /** Which edge of the plot area the axis runs along. */
  orientation: 'bottom' | 'left' | 'right'
  /** The area over the axis's ticks and label, in the plot area's pixel coordinates. */
  x: number
  y: number
  width: number
  height: number
  /** The axis's current range, and the range it may pan within. */
  domain: Domain
  full: Domain
  onChange: (domain: Domain) => void
  /** Double-clicking the axis resets it, however its owner sees fit. */
  onReset: () => void
  title: string
}

/** Lets the user pan one axis by dragging along it, independently of the others. */
export function AxisDragArea({ orientation, x, y, width, height, domain, full, onChange, onReset, title }: Props) {
  // Where the drag started, along the axis in screen pixels, and the axis's range at that moment.
  const [drag, setDrag] = useState<{ start: number; startDomain: Domain } | null>(null)

  const horizontal = orientation === 'bottom'
  const along = (event: PointerEvent) => (horizontal ? event.clientX : event.clientY)
  const length = horizontal ? width : height

  return (
    <rect
      className={`axis-drag-area axis-drag-area--${horizontal ? 'horizontal' : 'vertical'}`}
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(event: PointerEvent<SVGRectElement>) => {
        if (event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        setDrag({ start: along(event), startDomain: domain })
      }}
      onPointerMove={(event) => {
        if (!drag) return
        // The data follows the pointer, as when panning the plot: the range moves the opposite
        // way along x, and the same way down a vertical axis, whose pixels run downwards.
        const { startDomain } = drag
        const moved = ((along(event) - drag.start) / length) * (startDomain[1] - startDomain[0])
        onChange(pan(startDomain, horizontal ? -moved : moved, full))
      }}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
      onDoubleClick={onReset}
    >
      <title>{title}</title>
    </rect>
  )
}
