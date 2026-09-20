import { gql, useQuery, useLazyQuery } from '@apollo/client'
import type mapboxgl from 'mapbox-gl'
import React, { useReducer, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import Layout from '../../components/layout/Layout'
import { registerMediaMarkers } from '../../components/mapbox/mapboxHelperFunctions'
import useMapboxMap from '../../components/mapbox/MapboxMap'
import { MapLayerType } from '../../components/mapbox/mapStyles'
import { urlPresentModeSetupHook } from '../../components/photoGallery/mediaGalleryReducer'
import PresentView from '../../components/photoGallery/presentView/PresentView'
import { MediaMarker } from './MapPresentMarker'
import { PlacesAction, placesReducer } from './placesReducer'
import { mediaGeoJson } from './__generated__/mediaGeoJson'
import PlacesMediaDrawer from './PlacesMediaDrawer'
import { MediaGalleryFields } from '../../components/photoGallery/__generated__/MediaGalleryFields'
import {
  placePageQueryMedia,
  placePageQueryMediaVariables,
} from './__generated__/placePageQueryMedia'

const MapWrapper = styled.div`
  width: 100%;
  height: calc(100vh - 72px);
  position: relative;
  overflow: hidden;
`

const FloatingControlBar = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    top: 12px;
    left: 12px;
    right: 12px;
  }
`

const LeftControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`

const SearchBoxContainer = styled.div`
  position: relative;
  width: 280px;

  @media (max-width: 640px) {
    width: 100%;
  }
`

const SearchInput = styled.input`
  width: 100%;
  height: 38px;
  padding: 0 14px 0 34px;
  border-radius: 19px;
  background: rgba(18, 18, 22, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  color: #ffffff;
  font-size: 13px;
  outline: none;
  transition: all 200ms ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    border-color: #00d2ff;
    background: rgba(18, 18, 22, 0.95);
    box-shadow: 0 4px 24px rgba(0, 210, 255, 0.25);
  }
`

const SearchIcon = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  pointer-events: none;
`

const LayerButtonGroup = styled.div`
  display: flex;
  align-items: center;
  background: rgba(18, 18, 22, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  padding: 3px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
`

const LayerButton = styled.button<{ active: boolean }>`
  background: ${props => (props.active ? '#0284c7' : 'transparent')};
  color: ${props => (props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.75)')};
  border: none;
  border-radius: 16px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    color: #ffffff;
    background: ${props => (props.active ? '#0284c7' : 'rgba(255, 255, 255, 0.1)')};
  }
`

const StatsPill = styled.div`
  background: rgba(18, 18, 22, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  padding: 6px 14px;
  color: #38bdf8;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
`

const MAPBOX_DATA_QUERY = gql`
  query mediaGeoJson {
    myMediaGeoJson
  }
`

const QUERY_MEDIA = gql`
  query placePageQueryMedia($mediaIDs: [ID!]!) {
    mediaList(ids: $mediaIDs) {
      id
      title
      blurhash
      thumbnail {
        url
        width
        height
      }
      highRes {
        url
        width
        height
      }
      videoWeb {
        url
        width
        height
      }
      type
    }
  }
`

export type PresentMarker = {
  id: number | string
  cluster: boolean
}

const getMediaFromMarker = (map: mapboxgl.Map, presentMarker: PresentMarker) =>
  new Promise<MediaMarker[]>((resolve, reject) => {
    const { cluster, id } = presentMarker

    if (cluster) {
      const mediaSource = map.getSource('media') as mapboxgl.GeoJSONSource
      if (!mediaSource) {
        resolve([])
        return
      }

      mediaSource.getClusterLeaves(id as number, 1000, 0, (error, features) => {
        if (error) {
          reject(error)
          return
        }
        const media = features.map(feat => feat.properties) as MediaMarker[]
        resolve(media)
      })
    } else {
      const features = map.querySourceFeatures('media')
      const media = features.find(f => f.properties?.media_id == id)
        ?.properties as MediaMarker | undefined

      if (media === undefined) {
        resolve([])
        return
      }

      resolve([media])
    }
  })

const MapPage = () => {
  const { t } = useTranslation()
  const [currentLayer, setCurrentLayer] = useState<MapLayerType>('dark')
  const [searchQuery, setSearchQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMediaList, setDrawerMediaList] = useState<MediaGalleryFields[]>([])
  const [drawerLoading, setDrawerLoading] = useState(false)

  const { data: mapboxData } = useQuery<mediaGeoJson>(MAPBOX_DATA_QUERY, {
    fetchPolicy: 'cache-first',
  })

  const [markerMediaState, dispatchMarkerMedia] = useReducer(placesReducer, {
    presenting: false,
    activeIndex: -1,
    media: [],
  })

  const [loadMedia] = useLazyQuery<
    placePageQueryMedia,
    placePageQueryMediaVariables
  >(QUERY_MEDIA)

  const handleClusterSelect = useCallback((marker: MediaMarker) => {
    if (!mapboxMap) return

    setDrawerOpen(true)
    setDrawerLoading(true)

    const clusterId = marker.cluster ? marker.cluster_id : marker.media_id
    const isCluster = !!marker.cluster

    getMediaFromMarker(mapboxMap, { id: clusterId, cluster: isCluster })
      .then(mediaMarkers => {
        const ids = mediaMarkers.map(x => x.media_id)
        if (ids.length === 0) {
          setDrawerMediaList([])
          setDrawerLoading(false)
          return
        }

        loadMedia({
          variables: { mediaIDs: ids },
        }).then(res => {
          const fetched = (res.data?.mediaList || []) as MediaGalleryFields[]
          setDrawerMediaList(fetched)
          setDrawerLoading(false)
        })
      })
      .catch(err => {
        console.error('Failed to get media from marker:', err)
        setDrawerLoading(false)
      })
  }, [loadMedia])

  const { mapContainer, mapboxMap, mapboxToken } = useMapboxMap({
    layerType: currentLayer,
    configureMapbox: (map, mapboxLibrary) => {
      map.addControl(new mapboxLibrary.NavigationControl(), 'bottom-right')

      map.on('load', () => {
        if (!map) return

        map.addSource('media', {
          type: 'geojson',
          data: mapboxData?.myMediaGeoJson as never,
          cluster: true,
          clusterRadius: 50,
          clusterProperties: {
            thumbnail: ['coalesce', ['get', 'thumbnail'], false],
          },
        })

        map.addLayer({
          id: 'media-points',
          type: 'circle',
          source: 'media',
          filter: ['!', true],
        })

        registerMediaMarkers({
          map,
          mapboxLibrary,
          dispatchMarkerMedia,
          onSelectCluster: (marker) => {
            handleClusterSelect(marker)
          },
        })

        // Auto fit bounds to media points if any
        try {
          const geojson = mapboxData?.myMediaGeoJson as any
          if (geojson?.features && geojson.features.length > 0) {
            const bounds = new mapboxLibrary.LngLatBounds()
            geojson.features.forEach((feat: any) => {
              const coords = feat.geometry?.coordinates
              if (coords && coords.length === 2) {
                bounds.extend(coords)
              }
            })
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { padding: 80, maxZoom: 13 })
            }
          }
        } catch (e) {
          // ignore bounds error
        }
      })
    },
    mapboxOptions: {
      zoom: 2,
      center: [20, 20],
    },
  })

  // Hook up full-screen URL present mode
  urlPresentModeSetupHook({
    dispatchMedia: dispatchMarkerMedia,
    openPresentMode: event => {
      dispatchMarkerMedia({
        type: 'openPresentMode',
        activeIndex: event.state.activeIndex,
      })
    },
  })

  // Handle place geocoding search (OpenStreetMap Nominatim)
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || !mapboxMap) return

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          searchQuery.trim()
        )}`
      )
      const results = await res.json()
      if (results && results.length > 0) {
        const { lat, lon } = results[0]
        mapboxMap.flyTo({
          center: [parseFloat(lon), parseFloat(lat)],
          zoom: 11,
          essential: true,
        })
      }
    } catch (err) {
      console.warn('Geocoding search failed:', err)
    }
  }

  const totalPhotosCount = useMemo(() => {
    const geojson = mapboxData?.myMediaGeoJson as any
    return geojson?.features ? geojson.features.length : 0
  }, [mapboxData?.myMediaGeoJson])

  return (
    <Layout title={t('places_page.title', 'Places')}>
      <Helmet>
        <title>Places | Photoview</title>
      </Helmet>

      <MapWrapper>
        {/* Floating Top Control Bar */}
        <FloatingControlBar>
          <LeftControls>
            <form onSubmit={handleSearchSubmit}>
              <SearchBoxContainer>
                <SearchIcon>🔍</SearchIcon>
                <SearchInput
                  type="text"
                  placeholder="Search cities, landmarks, places..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </SearchBoxContainer>
            </form>

            <LayerButtonGroup>
              <LayerButton
                active={currentLayer === 'dark'}
                onClick={() => setCurrentLayer('dark')}
                title="Dark Matter Map"
              >
                🌙 Dark
              </LayerButton>
              <LayerButton
                active={currentLayer === 'light'}
                onClick={() => setCurrentLayer('light')}
                title="Voyager Light Map"
              >
                ☀️ Light
              </LayerButton>
              <LayerButton
                active={currentLayer === 'osm'}
                onClick={() => setCurrentLayer('osm')}
                title="OpenStreetMap"
              >
                🗺️ Streets
              </LayerButton>
              <LayerButton
                active={currentLayer === 'satellite'}
                onClick={() => setCurrentLayer('satellite')}
                title="Satellite Imagery"
              >
                🛰️ Satellite
              </LayerButton>
            </LayerButtonGroup>
          </LeftControls>

          <StatsPill>
            <span>📍</span>
            <span>{totalPhotosCount} Geotagged Photos</span>
          </StatsPill>
        </FloatingControlBar>

        {/* Mapbox Container */}
        {mapContainer}

        {/* Split Media Drawer for Selected Cluster */}
        <PlacesMediaDrawer
          open={drawerOpen}
          mediaList={drawerMediaList}
          loading={drawerLoading}
          onClose={() => setDrawerOpen(false)}
          onSelectMedia={(index) => {
            dispatchMarkerMedia({
              type: 'replaceMedia',
              media: drawerMediaList,
            })
            dispatchMarkerMedia({
              type: 'openPresentMode',
              activeIndex: index,
            })
          }}
          onPresentAll={() => {
            if (drawerMediaList.length > 0) {
              dispatchMarkerMedia({
                type: 'replaceMedia',
                media: drawerMediaList,
              })
              dispatchMarkerMedia({
                type: 'openPresentMode',
                activeIndex: 0,
              })
            }
          }}
        />
      </MapWrapper>

      {/* Full-Screen Presentation Viewer */}
      {markerMediaState.presenting && markerMediaState.media[markerMediaState.activeIndex] && (
        <PresentView
          activeMedia={markerMediaState.media[markerMediaState.activeIndex]}
          dispatchMedia={dispatchMarkerMedia}
          mediaList={markerMediaState.media}
          onSelectMedia={(_media, index) => {
            dispatchMarkerMedia({
              type: 'openPresentMode',
              activeIndex: index,
            })
          }}
          disableSaveCloseInHistory={true}
        />
      )}
    </Layout>
  )
}

export default MapPage
