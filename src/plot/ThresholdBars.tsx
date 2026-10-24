import type { Command, CurvatureSettings, VnextSettings } from '../api/types'
import { neighbourLimits } from './domains'
import type { Scale } from './scale'
import { ThresholdBar } from './ThresholdBar'

type Props = {
  /** Present under Curvature. */
  curvatureSettings: CurvatureSettings | null
  /** Present under Curvature (vnext). */
  vnextSettings: VnextSettings | null
  /** The −y'' axis's scale. */
  scale: Scale
  /** Whether to draw the thresholds, while −y'' is drawn to read them against. */
  showBars: boolean
  /** Whether to draw the boundaries of the ranges they apply over. */
  showBoundaries: boolean
  /** The domain whose bar to highlight, by its index. */
  hoveredDomain: number | null
  onHoverDomain: (domainIndex: number | null) => void
  onCommand: (command: Command) => Promise<void>
}

/**
 * The thresholds of whichever Curvature method is active, and the boundaries of the ranges they
 * apply over: Curvature's one, or one per domain under Curvature (vnext), each of whose ends stops
 * at its neighbours.
 */
export function ThresholdBars({
  curvatureSettings,
  vnextSettings,
  scale,
  showBars,
  showBoundaries,
  hoveredDomain,
  onHoverDomain,
  onCommand,
}: Props) {
  if (curvatureSettings) {
    return (
      <ThresholdBar
        threshold={{
          height: curvatureSettings.thresholdHeight,
          start: curvatureSettings.thresholdStart,
          end: curvatureSettings.thresholdEnd,
        }}
        scale={scale}
        showBar={showBars}
        showBoundaries={showBoundaries}
        title="Drag to change the curvature threshold"
        onHeightChange={(value) => onCommand({ kind: 'setThresholdHeight', value })}
        onRangeChange={(start, end) => onCommand({ kind: 'setThresholdDomain', start, end })}
      />
    )
  }

  if (!vnextSettings) return null
  const { domains } = vnextSettings
  return domains.map((domain, domainIndex) => (
    // Domains have no identity of their own beyond their place in order.
    <ThresholdBar
      key={domainIndex}
      threshold={{ height: domain.threshold, start: domain.start, end: domain.end }}
      limits={neighbourLimits(domains, domainIndex)}
      scale={scale}
      showBar={showBars}
      showBoundaries={showBoundaries}
      highlighted={domainIndex === hoveredDomain}
      title={`Drag to change domain ${domainIndex + 1}'s curvature threshold`}
      onHeightChange={(value) => onCommand({ kind: 'setDomainThreshold', domainIndex, value })}
      onRangeChange={(start, end) => onCommand({ kind: 'setDomainRange', domainIndex, start, end })}
      onHover={(hovered) => onHoverDomain(hovered ? domainIndex : null)}
    />
  ))
}
