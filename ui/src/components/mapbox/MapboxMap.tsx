import React, { useState, useRef, useEffect } from 'react'
import { gql, useQuery } from '@apollo/client'
import type mapboxgl from 'mapbox-gl'
import styled from 'styled-components'

import 'mapbox-gl/dist/mapbox-gl.css'
import { mapboxToken } from './__generated__/mapboxToken'
import { isDarkMode } from '../../theme'
import { getDefaultMapStyle, MapLayerType, getMapStyle } from './mapStyles'

export const MAPBOX_TOKEN_QUERY = gql`
  query mapboxToken {
    mapboxToken
    myMediaGeoJson
  }
`

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  .mapboxgl-ctrl-bottom-right,
  .mapboxgl-ctrl-bottom-left {
    z-index: 10;
  }
  .mapboxgl-ctrl-attrib {
    background: rgba(18, 18, 20, 0.75) !important;
    color: rgba(255, 255, 255, 0.7) !important;
    border-radius: 4px;
    font-size: 10.5px;
    padding: 2px 6px;
    a {
      color: #38bdf8 !important;
      text-decoration: none;
    }
  }
`

export type MapboxMapProps = {
  configureMapbox(map: mapboxgl.Map, mapboxLibrary: typeof mapboxgl): void
  mapboxOptions?: Partial<mapboxgl.MapboxOptions>
  layerType?: MapLayerType
}

const useMapboxMap = ({
  configureMapbox,
  mapboxOptions = undefined,
  layerType = undefined,
}: MapboxMapProps) => {
  const [mapboxLibrary, setMapboxLibrary] = useState<typeof mapboxgl>()
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const isInitialized = useRef(false)

  const { data: mapboxData } = useQuery<mapboxToken>(MAPBOX_TOKEN_QUERY, {
    fetchPolicy: 'cache-first',
  })

  useEffect(() => {
    let unmounted = false
    async function loadMapboxLibrary() {
      const mapbox = (await import('mapbox-gl')).default
      if (!unmounted) {
        setMapboxLibrary(mapbox)
      }
    }
    loadMapboxLibrary()
    return () => {
      unmounted = true
    }
  }, [])

  useEffect(() => {
    if (
      mapboxLibrary == null ||
      mapContainer.current == null ||
      map.current != null
    ) {
      return
    }

    const token = mapboxData?.mapboxToken
    if (token) {
      mapboxLibrary.accessToken = token
    }

    const dark = isDarkMode()
    const chosenStyle = layerType
      ? getMapStyle(layerType, dark, token)
      : (mapboxOptions?.style || getDefaultMapStyle(dark, token))

    try {
      const mapInstance = new mapboxLibrary.Map({
        container: mapContainer.current,
        style: chosenStyle,
        ...mapboxOptions,
      })

      map.current = mapInstance
      isInitialized.current = true

      configureMapbox(mapInstance, mapboxLibrary)
      mapInstance.resize()
    } catch (err) {
      console.error('Failed to initialize map:', err)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        isInitialized.current = false
      }
    }
  }, [mapContainer, mapboxLibrary, mapboxData])

  // Handle dynamic layer switch
  useEffect(() => {
    if (map.current && layerType) {
      const token = mapboxData?.mapboxToken
      const newStyle = getMapStyle(layerType, isDarkMode(), token)
      try {
        map.current.setStyle(newStyle)
      } catch (err) {
        console.warn('Failed to switch map style:', err)
      }
    }
  }, [layerType, mapboxData?.mapboxToken])

  map.current?.resize()

  return {
    mapContainer: <MapContainer ref={mapContainer} />,
    mapboxMap: map.current,
    mapboxLibrary,
    mapboxToken: mapboxData?.mapboxToken || null,
  }
}

export default useMapboxMap
