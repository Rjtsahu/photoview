import { describe, it, expect } from 'vitest'
import {
  CARTO_DARK_STYLE,
  CARTO_VOYAGER_STYLE,
  OSM_STYLE,
  SATELLITE_STYLE,
  getDefaultMapStyle,
  getMapStyle,
} from './mapStyles'

describe('mapStyles (zero-config tile engine)', () => {
  it('defines valid CARTO Dark Matter style with tile endpoints', () => {
    expect(CARTO_DARK_STYLE.version).toBe(8)
    expect(CARTO_DARK_STYLE.sources['carto-dark'].type).toBe('raster')
    expect(CARTO_DARK_STYLE.sources['carto-dark'].tiles.length).toBeGreaterThan(0)
    expect(CARTO_DARK_STYLE.sources['carto-dark'].tiles[0]).toContain('cartocdn.com')
    expect(CARTO_DARK_STYLE.layers[0].type).toBe('raster')
  })

  it('defines valid CARTO Voyager style', () => {
    expect(CARTO_VOYAGER_STYLE.version).toBe(8)
    expect(CARTO_VOYAGER_STYLE.sources['carto-voyager'].type).toBe('raster')
    expect(CARTO_VOYAGER_STYLE.sources['carto-voyager'].tiles[0]).toContain('voyager')
  })

  it('defines valid OpenStreetMap and Satellite raster styles', () => {
    expect(OSM_STYLE.sources['osm-tiles'].tiles[0]).toContain('openstreetmap.org')
    expect(SATELLITE_STYLE.sources['satellite-tiles'].tiles[0]).toContain('arcgisonline.com')
  })

  it('getDefaultMapStyle returns CARTO dark in dark mode and voyager in light mode without token', () => {
    const darkStyle = getDefaultMapStyle(true, null)
    expect(darkStyle).toBe(CARTO_DARK_STYLE)

    const lightStyle = getDefaultMapStyle(false, null)
    expect(lightStyle).toBe(CARTO_VOYAGER_STYLE)
  })

  it('getDefaultMapStyle delegates to Mapbox vector style if mapboxToken is present', () => {
    const darkStyle = getDefaultMapStyle(true, 'pk.test_token')
    expect(darkStyle).toBe('mapbox://styles/mapbox/dark-v10')

    const lightStyle = getDefaultMapStyle(false, 'pk.test_token')
    expect(lightStyle).toBe('mapbox://styles/mapbox/light-v10')
  })

  it('getMapStyle returns correct styles for all layer types', () => {
    expect(getMapStyle('dark', true, null)).toBe(CARTO_DARK_STYLE)
    expect(getMapStyle('light', true, null)).toBe(CARTO_VOYAGER_STYLE)
    expect(getMapStyle('osm', true, null)).toBe(OSM_STYLE)
    expect(getMapStyle('satellite', true, null)).toBe(SATELLITE_STYLE)

    // With Mapbox token
    expect(getMapStyle('satellite', true, 'pk.test')).toBe('mapbox://styles/mapbox/satellite-v9')
    expect(getMapStyle('osm', true, 'pk.test')).toBe('mapbox://styles/mapbox/streets-v11')
  })
})
