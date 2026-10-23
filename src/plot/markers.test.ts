import { describe, expect, it } from 'vitest'
import { boundaryMarkerPath, disc } from './markers'

describe('boundaryMarkerPath', () => {
  it('draws a baseline boundary as a triangle pointing up', () => {
    expect(boundaryMarkerPath('Baseline', 10, 20)).toBe('M5.38,24L14.62,24L10,16Z')
  })

  it('draws a valley boundary as a triangle pointing down', () => {
    expect(boundaryMarkerPath('Valley', 10, 20)).toBe('M5.38,16L14.62,16L10,24Z')
  })

  it('draws a shoulder boundary as a diamond taller than it is wide', () => {
    expect(boundaryMarkerPath('Shoulder', 10, 20)).toBe('M6,20L10,15.2L14,20L10,24.8Z')
  })

  it('draws a round boundary as a disc of the marker radius', () => {
    expect(boundaryMarkerPath('Round', 10, 20)).toBe(disc(10, 20, 4))
  })

  it('draws an unclassified boundary as a smaller disc', () => {
    expect(boundaryMarkerPath(null, 10, 20)).toBe(disc(10, 20, 3))
  })
})

describe('disc', () => {
  it('traces a full circle as two arcs', () => {
    expect(disc(10, 20, 4)).toBe('M6,20a4,4 0 1,0 8,0a4,4 0 1,0 -8,0Z')
  })
})
