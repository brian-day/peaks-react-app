import { scaleLinear } from 'd3-scale'
import { useMemo, useRef, useState } from 'react'
import type { Command, DatasetSnapshot, Method } from '../api/types'
import { useElementSize } from '../hooks/useElementSize'
import { AnalysisLayer } from './AnalysisLayer'
import { Axis } from './Axis'
import { InteractionLayer, type Mode } from './InteractionLayer'
import { PlotContext, type PlotGeometry } from './plotContext'
import { PlotToolbar } from './PlotToolbar'
import { dataPath, dataTransform } from './scale'
import { useWheelZoom } from './useWheelZoom'
import { traceBounds, type Viewport } from './viewport'

const HEIGHT = 380
const MARGIN = { top: 16, right: 24, bottom: 48, left: 72 }

type Props = {
  dataset: DatasetSnapshot
  method: Method
  /** Sends an edit to the analysis, resolving once it has been applied or has failed. */
  onCommand: (command: Command) => Promise<void>
}

/**
 * A dataset's trace with the analysis drawn over it and a toolbar above, filling the width of its
 * container. The plot zooms, pans, and under the Manual method adds and moves peaks.
 *
 * The zoom starts fully out and is kept as the analysis changes; give the plot a new `key` to
 * start over.
 */
export function ChromatogramPlot({ dataset, method, onCommand }: Props) {
  const [containerRef, { width }] = useElementSize<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right)
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom

  const { full, minSpan } = useMemo(() => traceBounds(dataset.trace), [dataset.trace])
  const [view, setView] = useState<Viewport>(full)
  const [chosenMode, setMode] = useState<Mode>('zoom')
  // Switching away from Manual leaves nothing to add peaks to, so dragging zooms again.
  const mode = chosenMode === 'addPeak' && method !== 'Manual' ? 'zoom' : chosenMode

  useWheelZoom(
    containerRef,
    { left: MARGIN.left, top: MARGIN.top, width: plotWidth, height: plotHeight },
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
      />
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
              <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                <Axis orientation="bottom" scale={xScale} offset={plotHeight} label={dataset.xUnits} />
                <Axis orientation="left" scale={yScale} offset={MARGIN.left - 16} label={dataset.yUnits} />
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
                  <path
                    className="trace"
                    d={tracePath}
                    transform={dataTransform(xScale, yScale)}
                  />
                </g>
              </g>
            </PlotContext>
          </svg>
        )}
      </div>
    </div>
  )
}
