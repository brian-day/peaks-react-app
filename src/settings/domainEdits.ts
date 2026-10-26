import type { Command, CurvatureSettings, DatasetSnapshot, DomainSettings, SmoothingMethod } from '../api/types'

/** A Curvature method's settings, as domains. */
export type CurvatureDetection = {
  /** Shared by every domain. */
  smoothingMethod: SmoothingMethod
  domains: DomainSettings[]
  /** The commands the table's edits send, for whichever Curvature method is active. */
  edits: DomainEdits
}

/**
 * The active Curvature method's settings as domains, or `null` under a method without any. Both
 * Curvature methods show their settings as domains; the Curvature method's one domain is its
 * threshold's range.
 */
export function curvatureDetection({
  curvatureSettings,
  vnextSettings,
}: Pick<DatasetSnapshot, 'curvatureSettings' | 'vnextSettings'>): CurvatureDetection | null {
  if (vnextSettings) {
    return { smoothingMethod: vnextSettings.smoothingMethod, domains: vnextSettings.domains, edits: VNEXT_EDITS }
  }
  if (curvatureSettings) {
    return {
      smoothingMethod: curvatureSettings.smoothingMethod,
      domains: [curvatureDomain(curvatureSettings)],
      edits: CURVATURE_EDITS,
    }
  }
  return null
}

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
