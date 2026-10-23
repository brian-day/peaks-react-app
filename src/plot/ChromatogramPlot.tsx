import { scaleLinear } from 'd3-scale'
import { useMemo, useState } from 'react'
import type { DatasetSnapshot } from '../api/types'
import { useElementSize } from '../hooks/useElementSize'
import { AnalysisLayer } from './AnalysisLayer'
import { Axis } from './Axis'
import { dataPath, dataTransform } from './scale'
import { useWheelZoom } from './useWheelZoom'
import { traceBounds, type Viewport } from './viewport'
import { ZoomPanLayer } from './ZoomPanLayer'

const HEIGHT = 380
const MARGIN = { top: 16, right: 24, bottom: 48, left: 72 }

/**
 * A dataset's trace with the analysis drawn over it, filling the width of its container, and
 * zoomable by dragging a box or scrolling.
 *
 * The zoom starts fully out and is not reset if `dataset` changes; give the plot a new `key` to
 * start over.
 */
export function ChromatogramPlot({ dataset }: { dataset: DatasetSnapshot }) {
  const [containerRef, { width }] = useElementSize<HTMLDivElement>()
  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right)
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom

  const { full, minSpan } = useMemo(() => traceBounds(dataset.trace), [dataset.trace])
  const [view, setView] = useState<Viewport>(full)

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

  // Built once per trace; zooming and panning only change the transform it is drawn with.
  const tracePath = useMemo(() => dataPath(dataset.trace), [dataset.trace])

  return (
    <div ref={containerRef} className="plot">
      {/* Nothing to draw until the container has been measured. */}
      {width > 0 && (
        <svg width={width} height={HEIGHT}>
          <defs>
            <clipPath id="plot-area">
              <rect width={plotWidth} height={plotHeight} />
            </clipPath>
          </defs>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            <Axis orientation="bottom" scale={xScale} offset={plotHeight} label={dataset.xUnits} />
            <Axis orientation="left" scale={yScale} offset={MARGIN.left - 16} label={dataset.yUnits} />
            <g clipPath="url(#plot-area)">
              <AnalysisLayer analysis={dataset.analysis} xScale={xScale} yScale={yScale} />
              <path className="trace" d={tracePath} transform={dataTransform(xScale, yScale)} />
            </g>
            <ZoomPanLayer
              view={view}
              full={full}
              minSpan={minSpan}
              xScale={xScale}
              yScale={yScale}
              width={plotWidth}
              height={plotHeight}
              onViewChange={setView}
            />
          </g>
        </svg>
      )}
    </div>
  )
}
