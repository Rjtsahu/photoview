import React from 'react'
import { useTranslation } from 'react-i18next'
import useMapboxMap from '../../mapbox/MapboxMap'
import { SidebarSection, SidebarSectionTitle } from '../SidebarComponents'
import { sidebarMediaQuery_media_exif_coordinates } from './__generated__/sidebarMediaQuery'

type MediaSidebarMapProps = {
  coordinates: sidebarMediaQuery_media_exif_coordinates
}

const MediaSidebarMap = ({ coordinates }: MediaSidebarMapProps) => {
  const { t } = useTranslation()

  const { mapContainer } = useMapboxMap({
    mapboxOptions: {
      interactive: true,
      zoom: 12,
      center: {
        lat: coordinates.latitude,
        lng: coordinates.longitude,
      },
    },
    configureMapbox: (map, mapboxLibrary) => {
      map.addControl(
        new mapboxLibrary.NavigationControl({ showCompass: false }),
        'top-right'
      )

      const centerMarker = new mapboxLibrary.Marker({
        color: '#00d2ff',
        scale: 0.9,
      })
      centerMarker.setLngLat({
        lat: coordinates.latitude,
        lng: coordinates.longitude,
      })
      centerMarker.addTo(map)
    },
  })

  return (
    <SidebarSection>
      <SidebarSectionTitle>
        {t('sidebar.location.title', 'Location')}
      </SidebarSectionTitle>
      <div className="w-full h-56 rounded-xl overflow-hidden shadow-inner border border-white/10 relative">
        {mapContainer}
      </div>
      <div className="mt-2 text-xs text-gray-400 font-mono flex items-center justify-between">
        <span>
          {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°
        </span>
        <a
          href={`https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=14/${coordinates.latitude}/${coordinates.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:underline"
        >
          View on OSM ↗
        </a>
      </div>
    </SidebarSection>
  )
}

export default MediaSidebarMap
