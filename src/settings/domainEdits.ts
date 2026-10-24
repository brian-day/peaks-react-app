import type { Command, CurvatureSettings, DomainSettings } from '../api/types'

/**
 * The commands a domain table sends, for whichever Curvature method is active. Each names the
 * domain by its place in order, as the table numbers them.
 */
export type DomainEdits = {
  setRange: (domainIndex: number, start: number, end: number) => Command
  setSmoothing: (domainIndex: number, value: number) => Command
  setThreshold: (domainIndex: number, value: number) => Command
  setLiftOffTouchDown: (domainIndex: number, liftOffPercent: number, touchDownPercent: number) => Command
  setMinimumPeakSize: (domainIndex: number, area: number, height: number) => Command
  /** Absent where domains cannot be removed. */
  remove?: (domainIndex: number) => Command
}

/** Curvature (vnext)'s domains, each edited on its own. */
export const VNEXT_EDITS: DomainEdits = {
  setRange: (domainIndex, start, end) => ({ kind: 'setDomainRange', domainIndex, start, end }),
  setSmoothing: (domainIndex, value) => ({ kind: 'setDomainSmoothing', domainIndex, value }),
  setThreshold: (domainIndex, value) => ({ kind: 'setDomainThreshold', domainIndex, value }),
  setLiftOffTouchDown: (domainIndex, liftOffPercent, touchDownPercent) => ({
    kind: 'setDomainLiftOffTouchDown',
    domainIndex,
    liftOffPercent,
    touchDownPercent,
  }),
  setMinimumPeakSize: (domainIndex, area, height) => ({ kind: 'setDomainMinimumPeakSize', domainIndex, area, height }),
  remove: (domainIndex) => ({ kind: 'removeDomain', domainIndex }),
}

/**
 * The Curvature method's settings, which apply over one domain: its threshold's range. There is
 * only ever that one, so the domain's place is not needed.
 */
export const CURVATURE_EDITS: DomainEdits = {
  setRange: (_, start, end) => ({ kind: 'setThresholdDomain', start, end }),
  setSmoothing: (_, value) => ({ kind: 'setSmoothing', value }),
  setThreshold: (_, value) => ({ kind: 'setThresholdHeight', value }),
  setLiftOffTouchDown: (_, liftOffPercent, touchDownPercent) => ({
    kind: 'setLiftOffTouchDown',
    liftOffPercent,
    touchDownPercent,
  }),
  setMinimumPeakSize: (_, area, height) => ({ kind: 'setMinimumPeakSize', area, height }),
}

/** The Curvature method's settings as the one domain they apply over. */
export function curvatureDomain(settings: CurvatureSettings): DomainSettings {
  return {
    start: settings.thresholdStart,
    end: settings.thresholdEnd,
    smoothing: settings.smoothing,
    defaultSmoothing: false,
    threshold: settings.thresholdHeight,
    liftOffPercent: settings.liftOffPercent,
    touchDownPercent: settings.touchDownPercent,
    minArea: settings.minArea,
    minHeight: settings.minHeight,
  }
}
