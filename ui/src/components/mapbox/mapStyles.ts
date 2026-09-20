export type MapLayerType = 'dark' | 'light' | 'osm' | 'satellite'

export const CARTO_DARK_STYLE: any = {
  version: 8,
  name: 'CARTO Dark Matter',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'carto-dark-tiles',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
}

export const CARTO_VOYAGER_STYLE: any = {
  version: 8,
  name: 'CARTO Voyager',
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'carto-voyager-tiles',
      type: 'raster',
      source: 'carto-voyager',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
}

export const OSM_STYLE: any = {
  version: 8,
  name: 'OpenStreetMap',
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

export const SATELLITE_STYLE: any = {
  version: 8,
  name: 'Satellite Imagery',
  sources: {
    'satellite-tiles': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  },
  layers: [
    {
      id: 'satellite-tiles',
      type: 'raster',
      source: 'satellite-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

export const getMapStyle = (
  layer: MapLayerType,
  isDark: boolean,
  mapboxToken?: string | null
): any => {
  if (mapboxToken) {
    if (layer === 'satellite') {
      return 'mapbox://styles/mapbox/satellite-v9'
    }
    if (layer === 'dark') {
      return 'mapbox://styles/mapbox/dark-v10'
    }
    if (layer === 'light') {
      return 'mapbox://styles/mapbox/light-v10'
    }
    if (layer === 'osm') {
      return 'mapbox://styles/mapbox/streets-v11'
    }
  }

  switch (layer) {
    case 'dark':
      return CARTO_DARK_STYLE
    case 'light':
      return CARTO_VOYAGER_STYLE
    case 'osm':
      return OSM_STYLE
    case 'satellite':
      return SATELLITE_STYLE
    default:
      return isDark ? CARTO_DARK_STYLE : CARTO_VOYAGER_STYLE
  }
}

export const getDefaultMapStyle = (
  isDark: boolean,
  mapboxToken?: string | null
): any => {
  return getMapStyle(isDark ? 'dark' : 'light', isDark, mapboxToken)
}
