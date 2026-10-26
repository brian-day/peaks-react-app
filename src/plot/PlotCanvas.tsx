import { scaleLinear } from 'd3-scale'
import { useMemo, useRef } from 'react'
import { allPeaks, peakKey } from '../api/peakIdentity'
import type { Command, DatasetSnapshot, InjectionTrace, Overlays, Point } from '../api/types'
import { useElementSize } from '../shared/useElementSize'
import { AnalysisLayer } from './AnalysisLayer'
import { Axis } from './Axis'
import { AxisDragArea } from './AxisDragArea'
import { withinDomains } from './domains'
import { peakAt } from './hitTest'
import { InteractionLayer, type AddMode, type Mode } from './InteractionLayer'
import { OtherTraces } from './OtherTraces'
import { PlotContext, type PlotGeometry } from './plotContext'
import { dataPath, dataTransform } from './scale'
import { SecondDerivativeCurve } from './SecondDerivativeCurve'
import { ThresholdBars } from './ThresholdBars'
import { usePlotView } from './usePlotView'
import { useWheelZoom } from './useWheelZoom'
import { UNBOUNDED } from './viewport'

const HEIGHT = 380
const MARGIN = { top: 16, right: 24, bottom: 48, left: 72 }
// Room on the right for the −y'' axis's ticks and label while it is shown.
const RIGHT_AXIS_MARGIN = 80
// How far each axis's label sits from its axis line, within the margin on that side.
const LABEL_DISTANCE = { bottom: 38, left: 56, right: 64 }

type Props = {
  dataset: DatasetSnapshot
  /** What dragging across the plot does. */
  mode: Mode
  /** What holding Alt (Option) drags out under the method, if anything can be added. */
  addMode: AddMode | null
  showTrace: boolean
  showSecondDerivative: boolean
  showDomains: boolean
  /** The last −y'' overlays fetched, or `null` before any are. */
  overlays: Overlays | null
  /** The other injections' traces while they are shown, or `null`. */
  otherTraces: InjectionTrace[] | null
  /** Sends an edit to the analysis, resolving once it has been applied or has failed. */
  onCommand: (command: Command) => Promise<void>
  /** The {@link peakKey} of the peak to highlight, whether hovered here or elsewhere. */
  hoveredKey: string | null
  /** Called with the peak under the pointer as it moves over the plot, or `null`. */
  onHoverPeak: (key: string | null) => void
  /** The domain whose threshold bar to highlight, by its index, whether hovered here or elsewhere. */
  hoveredDomain: number | null
  /** Called with the domain whose threshold bar the pointer is over, or `null`. */
  onHoverDomain: (domainIndex: number | null) => void
}

/**
 * The plot itself: a dataset's trace with the analysis drawn over it, filling the width of its
 * container. It zooms and pans, adds and moves peaks under Manual, and adds domains under Curvature
 * (vnext). Under the Curvature methods it can also draw −y'' of the smoothed data, on an axis of its
 * own.
 *
 * Zooming or panning the plot area moves −y'' along with the trace's y. Each axis can also be
 * zoomed (scroll over it), panned (drag along it) and reset (double-click it) on its own; reset
 * for the −y'' axis fits it to the part of the curve in view.
 *
 * The zoom starts fully out and is kept as the analysis changes; give the plot a new `key` to
 * start over.
 */
export function PlotCanvas({
  dataset,
  mode,
  addMode,
  showTrace,
  showSecondDerivative,
  showDomains,
  overlays,
  otherTraces,
  onCommand,
  hoveredKey,
  onHoverPeak,
  hoveredDomain,
  onHoverDomain,
}: Props) {
  const showRightAxis = showSecondDerivative && overlays !== null
  const margin = showRightAxis ? { ...MARGIN, right: RIGHT_AXIS_MARGIN } : MARGIN

  // The peak under the pointer, found by position rather than by the peaks' own pointer events,
  // since the peaks let the pointer through to the zoom and pan layer.
  const peaks = useMemo(() => allPeaks(dataset.analysis), [dataset.analysis])
  const hover = (point: Point | null) => {
    // Peaks that are not drawn cannot be under the pointer.
    const peak = point && showTrace ? peakAt(point, peaks) : null
    onHoverPeak(peak ? peakKey(peak.id) : null)
  }

  const [containerRef, { width }] = useElementSize<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const plotWidth = Math.max(0, width - margin.left - margin.right)
  const plotHeight = HEIGHT - margin.top - margin.bottom

  // −y'' only where detection happens: within the domains under Curvature (vnext), everywhere
  // otherwise. The axis fits to these parts too, so a gap's curvature cannot set its scale.
  const secondDerivativeStretches = useMemo(
    () => overlays && withinDomains(overlays.negativeSecondDerivative, overlays.domains),
    [overlays],
  )
  const secondDerivativePoints = useMemo(() => secondDerivativeStretches?.flat() ?? null, [secondDerivativeStretches])

  const { view, setView, full, minSpan, secondView, secondary, changePlotView, changeAxis, resetView, fitSecondToView } =
    usePlotView(dataset.trace, secondDerivativePoints, showRightAxis)

  useWheelZoom(
    containerRef,
    { left: margin.left, top: margin.top, width: plotWidth, height: plotHeight },
    full,
    minSpan,
    secondary,
    setView,
  )

  const { xScale, yScale } = useMemo(
    () => ({
      xScale: scaleLinear().domain(view.x).range([0, plotWidth]),
      yScale: scaleLinear().domain(view.y).range([plotHeight, 0]),
    }),
    [view, plotWidth, plotHeight],
  )

  const secondDerivativeScale = useMemo(
    () =>
      scaleLinear()
        .domain(secondView ?? [0, 1])
        .range([plotHeight, 0]),
    [secondView, plotHeight],
  )

  const plot = useMemo<PlotGeometry>(() => {
    // Reads the SVG's position when called, from a pointer event, not while rendering.
    const pointerToPixels = ({ clientX, clientY }: { clientX: number; clientY: number }) => {
      const bounds = svgRef.current?.getBoundingClientRect()
      return {
        x: clientX - (bounds?.left ?? 0) - MARGIN.left,
        y: clientY - (bounds?.top ?? 0) - MARGIN.top,
      }
    }
    return {
      xScale,
      yScale,
      width: plotWidth,
      height: plotHeight,
      pointerToPixels,
      pointerToData: (event) => {
        const pixels = pointerToPixels(event)
        return { x: xScale.invert(pixels.x), y: yScale.invert(pixels.y) }
      },
    }
  }, [xScale, yScale, plotWidth, plotHeight])

  // Built once per trace; zooming and panning only change the transform it is drawn with.
  const tracePath = useMemo(() => dataPath(dataset.trace), [dataset.trace])

  return (
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
              <Axis
                orientation="bottom"
                scale={xScale}
                position={plotHeight}
                labelDistance={LABEL_DISTANCE.bottom}
                label={dataset.xUnits}
              />
              <Axis
                orientation="left"
                scale={yScale}
                position={0}
                labelDistance={LABEL_DISTANCE.left}
                label={dataset.yUnits}
              />
              {showRightAxis && (
                <Axis
                  orientation="right"
                  scale={secondDerivativeScale}
                  position={plotWidth}
                  labelDistance={LABEL_DISTANCE.right}
                  label={`−y″ (${dataset.yUnits}/${dataset.xUnits}²)`}
                />
              )}
              <AxisDragArea
                orientation="bottom"
                x={0}
                y={plotHeight}
                width={plotWidth}
                height={margin.bottom}
                domain={view.x}
                full={full.x}
                onChange={(x) => changeAxis('x', x)}
                onReset={() => changeAxis('x', full.x)}
                title="Drag to pan x, scroll to zoom it, double-click to zoom it out"
              />
              <AxisDragArea
                orientation="left"
                x={-margin.left}
                y={0}
                width={margin.left}
                height={plotHeight}
                domain={view.y}
                full={full.y}
                onChange={(y) => changeAxis('y', y)}
                onReset={() => changeAxis('y', full.y)}
                title="Drag to pan y, scroll to zoom it, double-click to zoom it out"
              />
              {secondary && secondView && (
                <AxisDragArea
                  orientation="right"
                  x={plotWidth}
                  y={0}
                  width={margin.right}
                  height={plotHeight}
                  domain={secondView}
                  full={UNBOUNDED}
                  onChange={(y2) => changeAxis('y2', y2)}
                  onReset={fitSecondToView}
                  title="Drag to pan −y″, scroll to zoom it, double-click to fit it to the curve in view"
                />
              )}
              {/* Beneath the data, which lets the pointer through except at peaks' handles. */}
              <InteractionLayer
                mode={mode}
                altMode={addMode}
                view={view}
                full={full}
                minSpan={minSpan}
                onViewChange={changePlotView}
                onResetView={resetView}
                onAddPeak={(low, high) => void onCommand({ kind: 'addManualPeak', low, high })}
                onAddDomain={(start, end) => void onCommand({ kind: 'addDomain', start, end })}
                onHover={hover}
              />
              <g clipPath="url(#plot-area)">
                {/* Behind everything of the dataset being looked at. */}
                {otherTraces && <OtherTraces traces={otherTraces} activeDataset={dataset.index} />}
                {showTrace && (
                  <AnalysisLayer
                    analysis={dataset.analysis}
                    hoveredKey={hoveredKey}
                    onMoveBoundaries={(peakId, low, high) => onCommand({ kind: 'updateManualPeak', peakId, low, high })}
                  />
                )}
                {showTrace && <path className="trace" d={tracePath} transform={dataTransform(xScale, yScale)} />}
                {showRightAxis && (
                  <SecondDerivativeCurve stretches={secondDerivativeStretches ?? []} scale={secondDerivativeScale} />
                )}
                {/* The thresholds are on the −y'' axis, so only while −y'' is drawn to read them
                    against; the boundaries need no axis. */}
                {(showRightAxis || showDomains) && (
                  <ThresholdBars
                    curvatureSettings={dataset.curvatureSettings}
                    vnextSettings={dataset.vnextSettings}
                    scale={secondDerivativeScale}
                    showBars={showRightAxis}
                    showBoundaries={showDomains}
                    hoveredDomain={hoveredDomain}
                    onHoverDomain={onHoverDomain}
                    onCommand={onCommand}
                  />
                )}
              </g>
            </g>
          </PlotContext>
        </svg>
      )}
    </div>
  )
}
