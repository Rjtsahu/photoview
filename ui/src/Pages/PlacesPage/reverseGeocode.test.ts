import { describe, it, expect } from 'vitest'
import { getCachedReverseGeocode } from './reverseGeocode'

describe('reverseGeocode', () => {
  it('identifies Bengaluru coordinates accurately', () => {
    const res = getCachedReverseGeocode(12.93, 77.63)
    expect(res).not.toBeNull()
    expect(res?.city).toBe('Bengaluru')
    expect(res?.region).toBe('Karnataka')
    expect(res?.country).toBe('India')
  })

  it('identifies Nagpur coordinates accurately', () => {
    const res = getCachedReverseGeocode(21.15, 79.09)
    expect(res).not.toBeNull()
    expect(res?.city).toBe('Nagpur')
    expect(res?.region).toBe('Maharashtra')
  })

  it('identifies Pench National Park coordinates accurately', () => {
    const res = getCachedReverseGeocode(22.21, 79.74)
    expect(res).not.toBeNull()
    expect(res?.city).toBe('Pench National Park')
  })

  it('identifies Nainital coordinates accurately', () => {
    const res = getCachedReverseGeocode(29.39, 79.46)
    expect(res).not.toBeNull()
    expect(res?.city).toBe('Nainital')
  })

  it('identifies Raipur coordinates accurately', () => {
    const res = getCachedReverseGeocode(21.25, 81.56)
    expect(res).not.toBeNull()
    expect(res?.city).toBe('Raipur')
  })

  it('returns null for dummy 0.0, 0.0 coordinates', () => {
    const res = getCachedReverseGeocode(0.0, 0.0)
    expect(res).toBeNull()
  })

  it('provides coordinate fallback label for unknown coordinates', () => {
    const res = getCachedReverseGeocode(45.123, -120.456)
    expect(res).not.toBeNull()
    expect(res?.city).toContain('Location')
  })
})
