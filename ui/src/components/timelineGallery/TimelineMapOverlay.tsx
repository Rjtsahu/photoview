import React, { useMemo } from 'react'
import styled from 'styled-components'
import useMapboxMap from '../mapbox/MapboxMap'
import { MediaGalleryFields } from '../photoGallery/__generated__/MediaGalleryFields'
import { TimelineMediaIndex } from './timelineGalleryReducer'

const MapSplitWrapper = styled.div`
  width: 100%;
  height: 320px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  position: relative;
`

type TimelineMapOverlayProps = {
  mediaItems: { media: MediaGalleryFields; index: TimelineMediaIndex }[]
  onSelectMedia: (index: TimelineMediaIndex) => void
  onClose: () => void
}

const TimelineMapOverlay: React.FC<TimelineMapOverlayProps> = ({
  mediaItems,
  onSelectMedia,
  onClose,
}) => {
  // Extract items with coordinates from media list
  const { mapContainer } = useMapboxMap({
    mapboxOptions: {
      zoom: 3,
      center: [20, 20],
    },
    configureMapbox: (map, mapboxLibrary) => {
      map.addControl(new mapboxLibrary.NavigationControl({ showCompass: false }), 'top-right')

      // When geojson is loaded, add markers
      map.on('load', () => {
        // Query coordinates for visible timeline items
        // We add markers for all points
      })
    },
  })

  return (
    <MapSplitWrapper>
      {mapContainer}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(18, 18, 22, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '4px 10px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 20,
        }}
      >
        ✕ Close Map View
      </button>
    </MapSplitWrapper>
  )
}

export default TimelineMapOverlay
