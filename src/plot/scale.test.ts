import { scaleLinear } from 'd3-scale'
import { describe, expect, it } from 'vitest'
import { dataPath, dataTransform } from './scale'

describe('dataPath', () => {
  it('moves to the first point and draws lines through the rest', () => {
    expect(
      dataPath([
        [1, 2],
        [3, 4.5],
        [5, 0],
      ]),
    ).toBe('M1,2L3,4.5L5,0')
  })
})

describe('dataTransform', () => {
  it('scales and offsets x, and flips y for a downward pixel range', () => {
    const xScale = scaleLinear().domain([10, 20]).range([0, 500])
    const yScale = scaleLinear().domain([0, 4]).range([200, 0])
    expect(dataTransform(xScale, yScale)).toBe('matrix(50,0,0,-50,-500,200)')
  })
})
