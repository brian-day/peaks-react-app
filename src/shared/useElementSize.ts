import { useEffect, useRef, useState } from 'react'

/**
 * Measures an element and re-measures it whenever it resizes.
 *
 * Attach the returned ref to the element. The size is zero until the first measurement.
 */
export function useElementSize<T extends Element>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, size] as const
}
