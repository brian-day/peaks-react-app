import { scaleLinear } from 'd3-scale'
import { useMemo, useRef, useState } from 'react'
import type { Command, DatasetSnapshot, Method } from '../api/types'
import { MessageList } from '../components/MessageList'
import { useElementSize } from '../hooks/useElementSize'
import { AnalysisLayer } from './AnalysisLayer'
import { Axis } from './Axis'
import { InteractionLayer, type Mode } from './InteractionLayer'
import { OverlayLayer, type ShownOverlays } from './OverlayLayer'
import { PlotContext, type PlotGeometry } from './plotContext'
import { PlotToolbar } from './PlotToolbar'
import { dataPath, dataTransform } from './scale'
import { useOverlays } from './useOverlays'
import { useWheelZoom } from './useWheelZoom'
import { fitToVisible, traceBounds, type Viewport } from './viewport'

const HEIGHT = 380
const MARGIN = { top: 16, right: 24, bottom: 48, left: 72 }
// Room on the right for the −y'' axis's ticks and label while it is shown.
const RIGHT_AXIS_MARGIN = 80

type Props = {
  sessionId: string
  dataset: DatasetSnapshot
  method: Method
  /** Sends an edit to the analysis, resolving once it has been applied or has failed. */
  onCommand: (command: Command) => Promise<void>
}

/**
 * A dataset's trace with the analysis drawn over it and a toolbar above, filling the width of its
 * container. The plot zooms, pans, and under the Manual method adds and moves peaks. Under the
 * Curvature method it can also overlay the smoothed data and its −y'', on an axis of its own.
 *
 * The zoom starts fully out and is kept as the analysis changes; give the plot a new `key` to
 * start over.
 */
export function ChromatogramPlot({ sessionId, dataset, method, onCommand }: Props) {
  const [chosenMode, setMode] = useState<Mode>('zoom')
  // Switching away from Manual leaves nothing to add peaks to, so dragging zooms again.
  const mode = chosenMode === 'addPeak' && method !== 'Manual' ? 'zoom' : chosenMode

  // The overlays only exist under Curvature. The choice is kept while another method is active,
  // so they come back on returning to it.
  const [chosenOverlays, setChosenOverlays] = useState<ShownOverlays>({ smoothed: false, secondDerivative: false })
  const isCurvature = method === 'Curvature'
  const shownOverlays: ShownOverlays = {
    smoothed: isCurvature && chosenOverlays.smoothed,
    secondDerivative: isCurvature && chosenOverlays.secondDerivative,
  }
  const { overlays, errors: overlayErrors } = useOverlays(
    sessionId,
    shownOverlays.smoothed || shownOverlays.secondDerivative,
    dataset.analysis,
  )
  const showRightAxis = shownOverlays.secondDerivative && overlays !== null
  const margin = showRightAxis ? { ...MARGIN, right: RIGHT_AXIS_MARGIN } : MARGIN

  const [containerRef, { width }] = useElementSize<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const plotWidth = Math.max(0, width - margin.left - margin.right)
  const plotHeight = HEIGHT - margin.top - margin.bottom

  const { full, minSpan } = useMemo(() => traceBounds(dataset.trace), [dataset.trace])
  const [view, setView] = useState<Viewport>(full)

  useWheelZoom(
    containerRef,
    { left: margin.left, top: margin.top, width: plotWidth, height: plotHeight },
    full,
    minSpan,
    setView,
  )

  const { xScale, yScale } = useMemo(
    () => ({
      xScale: scaleLinear().domain(view.x).range([0, plotWidth]),
      yScale: scaleLinear().domain(view.y).range([plotHeight, 0]),
    }),
    [view, plotWidth, plotHeight],
  )

  // Fitted to the part of −y'' in view, so zooming in on a small peak shows its curvature rather
  // than leaving it flattened by the tallest peak elsewhere.
  const secondDerivativeScale = useMemo(() => {
    const visible = overlays && fitToVisible(overlays.negativeSecondDerivative, view.x)
    return scaleLinear()
      .domain(visible ?? [0, 1])
      .range([plotHeight, 0])
  }, [overlays, view.x, plotHeight])

  const plot = useMemo<PlotGeometry>(
    () => ({
      xScale,
      yScale,
      width: plotWidth,
      height: plotHeight,
      // Reads the SVG's position when called, from a pointer event, not while rendering.
      pointerToData: ({ clientX, clientY }) => {
        const bounds = svgRef.current?.getBoundingClientRect()
        return {
          x: xScale.invert(clientX - (bounds?.left ?? 0) - MARGIN.left),
          y: yScale.invert(clientY - (bounds?.top ?? 0) - MARGIN.top),
        }
      },
    }),
    [xScale, yScale, plotWidth, plotHeight],
  )

  // Built once per trace; zooming and panning only change the transform it is drawn with.
  const tracePath = useMemo(() => dataPath(dataset.trace), [dataset.trace])

  return (
    <div className="plot-panel">
      <PlotToolbar
        method={method}
        onMethodChange={(newMethod) => onCommand({ kind: 'setMethod', method: newMethod })}
        mode={mode}
        onModeChange={setMode}
        overlays={chosenOverlays}
        onOverlaysChange={setChosenOverlays}
      />
      <MessageList messages={overlayErrors} />
      <div ref={containerRef} className="plot">
        {/* Nothing to draw until the container has been measured. */}
        {width > 0 && (
          <svg ref={svgRef} width={width} height={HEIGHT}>
            <defs>
              <clipPath id="plot-area">
                <rect width={plotWidth} height={plotHeight} />
              </clipPath>
            </defs>
            <PlotContext value={plot}>
              <g transform={`translate(${margin.left},${margin.top})`}>
                <Axis orientation="bottom" scale={xScale} position={plotHeight} labelDistance={38} label={dataset.xUnits} />
                <Axis orientation="left" scale={yScale} position={0} labelDistance={56} label={dataset.yUnits} />
                {showRightAxis && (
                  <Axis
                    orientation="right"
                    scale={secondDerivativeScale}
                    position={plotWidth}
                    labelDistance={64}
                    label={`−y″ (${dataset.yUnits}/${dataset.xUnits}²)`}
                  />
                )}
                {/* Beneath the data, which lets the pointer through to it except at the handles
                    on editable peaks, so dragging a handle moves it and dragging elsewhere does
                    whatever the mode says. */}
                <InteractionLayer
                  mode={mode}
                  canAddPeaks={method === 'Manual'}
                  view={view}
                  full={full}
                  minSpan={minSpan}
                  onViewChange={setView}
                  onAddPeak={(low, high) => onCommand({ kind: 'addManualPeak', low, high })}
                />
                <g clipPath="url(#plot-area)">
                  <AnalysisLayer
                    analysis={dataset.analysis}
                    onMoveBoundaries={(peakId, low, high) =>
                      onCommand({ kind: 'updateManualPeak', peakId, low, high })
                    }
                  />
                  <path className="trace" d={tracePath} transform={dataTransform(xScale, yScale)} />
                  {overlays && (
                    <OverlayLayer
                      overlays={overlays}
                      shown={shownOverlays}
                      secondDerivativeScale={secondDerivativeScale}
                    />
                  )}
                </g>
              </g>
            </PlotContext>
          </svg>
        )}
      </div>
    </div>
  )
}
