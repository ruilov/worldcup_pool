import { describe, it, expect } from 'vitest'
import { double } from './math'

describe('double', () => {
  it('doubles positive numbers', () => {
    expect(double(2)).toBe(4)
    expect(double(10)).toBe(20)
  })

  it('doubles zero', () => {
    expect(double(0)).toBe(0)
  })

  it('doubles negative numbers', () => {
    expect(double(-3)).toBe(-6)
  })
})
