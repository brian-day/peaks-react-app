import { scaleLinear } from 'd3-scale'
import { useMemo } from 'react'
import type { DatasetSnapshot, XY } from '../api/types'
import { useElementSize } from '../hooks/useElementSize'
import { AnalysisLayer } from './AnalysisLayer'
import { Axis } from './Axis'
import { linePath } from './scale'

const HEIGHT = 380
const MARGIN = { top: 16, right: 24, bottom: 48, left: 72 }

/** A dataset's trace with the analysis drawn over it, filling the width of its container. */
export function ChromatogramPlot({ dataset }: { dataset: DatasetSnapshot }) {
  const [containerRef, { width }] = useElementSize<HTMLDivElement>()
  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right)
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom

  const { xScale, yScale } = useMemo(() => {
    const [xMin, xMax, yMin, yMax] = extent(dataset.trace)
    return {
      xScale: scaleLinear().domain([xMin, xMax]).range([0, plotWidth]),
      yScale: scaleLinear().domain([yMin, yMax]).range([plotHeight, 0]).nice(),
    }
  }, [dataset.trace, plotWidth, plotHeight])

  const tracePath = useMemo(() => linePath(dataset.trace, xScale, yScale), [dataset.trace, xScale, yScale])

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
              <path className="trace" d={tracePath} />
            </g>
          </g>
        </svg>
      )}
    </div>
  )
}

/** The bounds of the points as `[xMin, xMax, yMin, yMax]`. */
function extent(points: readonly XY[]): [number, number, number, number] {
  let [xMin, xMax, yMin, yMax] = [Infinity, -Infinity, Infinity, -Infinity]
  for (const [x, y] of points) {
    xMin = Math.min(xMin, x)
    xMax = Math.max(xMax, x)
    yMin = Math.min(yMin, y)
    yMax = Math.max(yMax, y)
  }
  return [xMin, xMax, yMin, yMax]
}
