import React from 'react'
import styled from 'styled-components'
import { MediaMarker } from './MapPresentMarker'
import { PlacesAction } from './placesReducer'

const MarkerWrapper = styled.div`
  position: relative;
  width: 52px;
  height: 52px;
  margin-top: -26px;
  margin-left: -26px;
  cursor: pointer;
  transform: translateZ(0);
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: scale(1.15) translateY(-3px);
    z-index: 50;
  }
`

const ThumbnailContainer = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2.5px solid #00d2ff;
  box-shadow: 0 4px 16px rgba(0, 210, 255, 0.45), 0 2px 6px rgba(0, 0, 0, 0.8);
  overflow: hidden;
  background: #18181b;
  position: relative;
`

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const CountBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  border-radius: 11px;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: 1.5px solid #ffffff;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`

const PinTail = styled.div`
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 7px solid #00d2ff;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));
`

type MapClusterMarkerProps = {
  dispatchMarkerMedia: React.Dispatch<PlacesAction>
  marker: MediaMarker
  onSelectCluster?: (marker: MediaMarker) => void
}

const MapClusterMarker = ({
  marker,
  dispatchMarkerMedia,
  onSelectCluster,
}: MapClusterMarkerProps) => {
  let thumbUrl = ''
  try {
    if (typeof marker.thumbnail === 'string') {
      const parsed = JSON.parse(marker.thumbnail)
      thumbUrl = parsed.url
    } else if (marker.thumbnail && (marker.thumbnail as any).url) {
      thumbUrl = (marker.thumbnail as any).url
    }
  } catch {
    thumbUrl = ''
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSelectCluster) {
      onSelectCluster(marker)
    } else {
      dispatchMarkerMedia({
        type: 'replacePresentMarker',
        marker: {
          cluster: !!marker.cluster,
          id: marker.cluster ? marker.cluster_id : marker.media_id,
        },
      })
    }
  }

  const count = marker.point_count_abbreviated || (marker as any).point_count

  return (
    <MarkerWrapper onClick={handleClick} title={marker.cluster ? `Cluster of ${count} photos` : 'View photo'}>
      <ThumbnailContainer>
        {thumbUrl ? (
          <ThumbnailImage src={thumbUrl} alt="" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white">📷</div>
        )}
      </ThumbnailContainer>
      {marker.cluster && count > 1 && (
        <CountBadge>{count}</CountBadge>
      )}
      <PinTail />
    </MarkerWrapper>
  )
}

export default MapClusterMarker
