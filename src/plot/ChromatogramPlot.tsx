import { scaleLinear } from 'd3-scale'
import { useCallback, useMemo, useRef, useState } from 'react'
import { addModeFor, hasSecondDerivative } from '../api/methods'
import { allPeaks, peakKey } from '../api/peakIdentity'
import type { Command, DatasetSnapshot, Method, Point } from '../api/types'
import { MessageList } from '../components/MessageList'
import { useElementSize } from '../hooks/useElementSize'
import { DetectionSettings } from '../settings/DetectionSettings'
import { VnextDetectionSettings } from '../settings/VnextDetectionSettings'
import { peakAt } from './hitTest'
import { AnalysisLayer } from './AnalysisLayer'
import { Axis } from './Axis'
import { AxisDragArea } from './AxisDragArea'
import { DomainToolbar } from './DomainToolbar'
import { InteractionLayer, type Mode } from './InteractionLayer'
import { OtherTraces } from './OtherTraces'
import { PlotContext, type PlotGeometry } from './plotContext'
import { PlotToolbar } from './PlotToolbar'
import { dataPath, dataTransform } from './scale'
import { withinDomains } from './domains'
import { SecondDerivativeCurve } from './SecondDerivativeCurve'
import { ThresholdBars } from './ThresholdBars'
import { useOverlays } from './useOverlays'
import { useTraces } from './useTraces'
import { useWheelZoom } from './useWheelZoom'
import {
  fitToVisible,
  followProportionally,
  traceBounds,
  type Domain,
  type PlotView,
  type SecondaryAxis,
  UNBOUNDED,
  type Viewport,
} from './viewport'

const HEIGHT = 380
const MARGIN = { top: 16, right: 24, bottom: 48, left: 72 }
// Room on the right for the −y'' axis's ticks and label while it is shown.
const RIGHT_AXIS_MARGIN = 80

type Props = {
  sessionId: string
  dataset: DatasetSnapshot
  method: Method
  /** Whether the session has traces other than this dataset's, as a protocol does. */
  hasOtherTraces: boolean
  /** Sends an edit to the analysis, resolving once it has been applied or has failed. */
  onCommand: (command: Command) => Promise<void>
  /** The {@link peakKey} of the peak to highlight, whether hovered here or elsewhere. */
  hoveredKey: string | null
  /** Called with the peak under the pointer as it moves over the plot, or `null`. */
  onHoverPeak: (key: string | null) => void
}

/**
 * A dataset's trace with the analysis drawn over it and a toolbar above, filling the width of its
 * container. The plot zooms, pans, under the Manual method adds and moves peaks, and under
 * Curvature (vnext) adds domains. Under the
 * Curvature method it can also overlay the −y'' of the smoothed data, on an axis of its own.
 *
 * Zooming or panning the plot area moves −y'' along with the trace's y. Each axis can also be
 * zoomed (scroll over it), panned (drag along it) and reset (double-click it) on its own; reset
 * for the −y'' axis fits it to the part of the curve in view.
 *
 * The zoom starts fully out and is kept as the analysis changes; give the plot a new `key` to
 * start over.
 */
export function ChromatogramPlot({
  sessionId,
  dataset,
  method,
  hasOtherTraces,
  onCommand,
  hoveredKey,
  onHoverPeak,
}: Props) {
  const [chosenMode, setMode] = useState<Mode>('zoom')
  // Switching to a method that cannot add what the mode adds leaves dragging to zoom again.
  const addMode = addModeFor(method)
  const mode = (chosenMode === 'addPeak' || chosenMode === 'addDomain') && chosenMode !== addMode ? 'zoom' : chosenMode
  // The domain hovered in the domain table or on the plot, highlighted in both.
  const [hoveredDomain, setHoveredDomain] = useState<number | null>(null)

  // −y'' only exists under the Curvature methods. The choice is kept while another method is active,
  // so the curve comes back on returning to one.
  const [chosenSecondDerivative, setChosenSecondDerivative] = useState(false)
  // Hiding the trace hides the peaks drawn on it too, leaving −y'' and its threshold to read on
  // their own. The table still lists the peaks.
  const [showTrace, setShowTrace] = useState(true)
  // The domains' boundaries are shown from the start, so a domain just added can be seen. Drawn
  // apart from −y'', they place the peaks on the trace too.
  const [chosenDomains, setChosenDomains] = useState(true)
  const showDomains = hasSecondDerivative(method) && chosenDomains
  const showSecondDerivative = hasSecondDerivative(method) && chosenSecondDerivative
  // The other injections' traces, fetched the first time they are shown.
  const [chosenOtherTraces, setChosenOtherTraces] = useState(false)
  const showOtherTraces = hasOtherTraces && chosenOtherTraces
  const { traces: otherTraces, messages: otherTraceMessages } = useTraces(sessionId, showOtherTraces)
  const { overlays, errors: overlayErrors } = useOverlays(sessionId, showSecondDerivative, dataset.analysis)
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

  const { full, minSpan } = useMemo(() => traceBounds(dataset.trace), [dataset.trace])
  const [view, setView] = useState<PlotView>({ ...full, y2: null })

  // −y'' only where detection happens: within the domains under Curvature (vnext), everywhere
  // otherwise. The axis fits to these parts too, so a gap's curvature cannot set its scale.
  const secondDerivativeStretches = useMemo(
    () => overlays && withinDomains(overlays.negativeSecondDerivative, overlays.domains),
    [overlays],
  )
  const secondDerivativePoints = useMemo(() => secondDerivativeStretches?.flat() ?? null, [secondDerivativeStretches])

  // The whole −y'' curve's range: where its axis starts and is reset to, though not a limit on it.
  const secondFull = useMemo(
    () => secondDerivativePoints && fitToVisible(secondDerivativePoints, [-Infinity, Infinity]),
    [secondDerivativePoints],
  )
  const secondary = useMemo<SecondaryAxis | null>(
    () => (showRightAxis && secondFull ? { whole: secondFull, minSpan: (secondFull[1] - secondFull[0]) / 10000 } : null),
    [showRightAxis, secondFull],
  )

  // −y'' spans the whole curve until the user first moves it. From then on it moves only as the
  // user zooms and pans, and is kept as the curve is fetched again after an edit, so before and
  // after can be compared at the same scale.
  const secondView = view.y2 ?? secondFull

  // A zoom box or pan in the plot area moves −y'' along with the trace's y, by the same proportion.
  const changePlotView = useCallback(
    (next: Viewport) =>
      setView((current) => {
        const y2 = current.y2 ?? secondFull
        return { x: next.x, y: next.y, y2: y2 && followProportionally(current.y, next.y, y2) }
      }),
    [secondFull],
  )
  const changeAxis = (axis: 'x' | 'y' | 'y2', domain: Domain) => setView((current) => ({ ...current, [axis]: domain }))

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
    <div className="plot-panel">
      <PlotToolbar
        method={method}
        onMethodChange={(newMethod) => onCommand({ kind: 'setMethod', method: newMethod })}
        mode={mode}
        onModeChange={setMode}
        trace={showTrace}
        onTraceChange={setShowTrace}
        hasOtherTraces={hasOtherTraces}
        otherTraces={chosenOtherTraces}
        onOtherTracesChange={setChosenOtherTraces}
        secondDerivative={chosenSecondDerivative}
        onSecondDerivativeChange={setChosenSecondDerivative}
        domains={chosenDomains}
        onDomainsChange={setChosenDomains}
      />
      {method === 'CurvatureVnext' && dataset.vnextSettings && (
        <DomainToolbar domains={dataset.vnextSettings.domains} onCommand={onCommand} />
      )}
      {method === 'Curvature' && dataset.curvatureSettings && (
        <DetectionSettings
          settings={dataset.curvatureSettings}
          units={{ x: dataset.xUnits, y: dataset.yUnits }}
          onCommand={onCommand}
        />
      )}
      {method === 'CurvatureVnext' && dataset.vnextSettings && (
        <VnextDetectionSettings
          settings={dataset.vnextSettings}
          units={{ x: dataset.xUnits, y: dataset.yUnits }}
          hoveredDomain={hoveredDomain}
          onHoverDomain={setHoveredDomain}
          onCommand={onCommand}
        />
      )}
      <MessageList messages={[...overlayErrors, ...(showOtherTraces ? otherTraceMessages : [])]} />
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
                {showRightAxis && secondView && secondFull && overlays && (
                  <AxisDragArea
                    orientation="right"
                    x={plotWidth}
                    y={0}
                    width={margin.right}
                    height={plotHeight}
                    domain={secondView}
                    full={UNBOUNDED}
                    onChange={(y2) => changeAxis('y2', y2)}
                    onReset={() =>
                      changeAxis('y2', (secondDerivativePoints && fitToVisible(secondDerivativePoints, view.x)) ?? secondFull)
                    }
                    title="Drag to pan −y″, scroll to zoom it, double-click to fit it to the curve in view"
                  />
                )}
                {/* Beneath the data, which lets the pointer through to it except at the handles
                    on editable peaks, so dragging a handle moves it and dragging elsewhere does
                    whatever the mode says. */}
                <InteractionLayer
                  mode={mode}
                  altMode={addMode}
                  view={view}
                  full={full}
                  minSpan={minSpan}
                  onViewChange={changePlotView}
                  onResetView={() => setView({ ...full, y2: secondFull })}
                  onAddPeak={(low, high) => onCommand({ kind: 'addManualPeak', low, high })}
                  onAddDomain={(start, end) => onCommand({ kind: 'addDomain', start, end })}
                  onHover={hover}
                />
                <g clipPath="url(#plot-area)">
                  {/* Behind everything of the dataset being looked at. */}
                  {showOtherTraces && otherTraces && (
                    <OtherTraces traces={otherTraces} activeDataset={dataset.index} />
                  )}
                  {showTrace && (
                    <AnalysisLayer
                      analysis={dataset.analysis}
                      hoveredKey={hoveredKey}
                      onMoveBoundaries={(peakId, low, high) =>
                        onCommand({ kind: 'updateManualPeak', peakId, low, high })
                      }
                    />
                  )}
                  {showTrace && (
                    <path className="trace" d={tracePath} transform={dataTransform(xScale, yScale)} />
                  )}
                  {showSecondDerivative && overlays && (
                    <SecondDerivativeCurve
                      stretches={secondDerivativeStretches ?? []}
                      scale={secondDerivativeScale}
                    />
                  )}
                  {/* The thresholds are on the −y'' axis, so only while −y'' is drawn to read them
                      against; the boundaries need no axis. */}
                  {((showSecondDerivative && overlays) || showDomains) && (
                    <ThresholdBars
                      curvatureSettings={dataset.curvatureSettings}
                      vnextSettings={dataset.vnextSettings}
                      scale={secondDerivativeScale}
                      showBars={showSecondDerivative && overlays !== null}
                      showBoundaries={showDomains}
                      hoveredDomain={hoveredDomain}
                      onHoverDomain={setHoveredDomain}
                      onCommand={onCommand}
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
