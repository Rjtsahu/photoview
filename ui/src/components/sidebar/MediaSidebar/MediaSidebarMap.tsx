import React from 'react'
import { useTranslation } from 'react-i18next'
import { SidebarSection, SidebarSectionTitle } from '../SidebarComponents'
import { sidebarMediaQuery_media_exif_coordinates } from './__generated__/sidebarMediaQuery'
import { getCachedReverseGeocode } from '../../../Pages/PlacesPage/reverseGeocode'

type MediaSidebarLocationProps = {
  coordinates: sidebarMediaQuery_media_exif_coordinates
}

const MediaSidebarLocation = ({ coordinates }: MediaSidebarLocationProps) => {
  const { t } = useTranslation()
  const locInfo = getCachedReverseGeocode(coordinates.latitude, coordinates.longitude)

  return (
    <SidebarSection>
      <SidebarSectionTitle>
        {t('sidebar.location.title', 'Location')}
      </SidebarSectionTitle>
      <div className="bg-gray-50 dark:bg-dark-input-bg p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-sm">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>📍</span>
          <span>{locInfo?.city || 'Geotagged Location'}</span>
        </div>
        {locInfo?.region && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-6">
            {locInfo.region}, {locInfo.country}
          </div>
        )}
        <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-400 font-mono">
          <span>
            {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°
          </span>
          <a
            href={`https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=15/${coordinates.latitude}/${coordinates.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-500 hover:text-cyan-400 hover:underline"
          >
            View on Map ↗
          </a>
        </div>
      </div>
    </SidebarSection>
  )
}

export default MediaSidebarLocation
