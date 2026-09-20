import React from 'react'
import styled from 'styled-components'
import { MediaGalleryFields } from '../../components/photoGallery/__generated__/MediaGalleryFields'
import { MediaType } from '../../__generated__/globalTypes'

const DrawerOverlay = styled.div<{ open: boolean }>`
  position: absolute;
  top: 72px;
  right: 16px;
  bottom: 24px;
  width: 380px;
  max-width: calc(100vw - 32px);
  background: rgba(18, 18, 22, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.65);
  border-radius: 16px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease;
  transform: ${props => (props.open ? 'translateX(0)' : 'translateX(110%)')};
  opacity: ${props => (props.open ? 1 : 0)};
  pointer-events: ${props => (props.open ? 'auto' : 'none')};

  @media (max-width: 640px) {
    left: 12px;
    right: 12px;
    width: auto;
    bottom: 12px;
    top: auto;
    max-height: 60vh;
  }
`

const DrawerHeader = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const HeaderTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  border-radius: 8px;
  padding: 4px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 150ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.35);
  }
`

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 6px;
  line-height: 1;
  border-radius: 6px;
  transition: color 150ms ease;

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }
`

const MediaGrid = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`

const MediaCard = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #1e1e24;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 160ms ease, box-shadow 160ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    border-color: #00d2ff;
  }
`

const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const VideoIndicator = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  border-radius: 4px;
  padding: 2px 5px;
  font-size: 10px;
  color: #ffffff;
  font-weight: 600;
`

type PlacesMediaDrawerProps = {
  open: boolean
  mediaList: MediaGalleryFields[]
  loading: boolean
  onClose: () => void
  onSelectMedia: (index: number) => void
  onPresentAll: () => void
}

const PlacesMediaDrawer: React.FC<PlacesMediaDrawerProps> = ({
  open,
  mediaList,
  loading,
  onClose,
  onSelectMedia,
  onPresentAll,
}) => {
  return (
    <DrawerOverlay open={open}>
      <DrawerHeader>
        <HeaderTitle>
          <span>📍</span>
          <span>
            {mediaList.length > 0
              ? `${mediaList.length} Photo${mediaList.length > 1 ? 's' : ''}`
              : loading
              ? 'Loading location...'
              : 'Location'}
          </span>
        </HeaderTitle>
        <HeaderActions>
          {mediaList.length > 0 && (
            <ActionButton onClick={onPresentAll} title="View all in full screen">
              ▶ Slideshow
            </ActionButton>
          )}
          <CloseButton onClick={onClose} aria-label="Close drawer">
            ✕
          </CloseButton>
        </HeaderActions>
      </DrawerHeader>

      <MediaGrid>
        {loading && (
          <div className="col-span-2 py-10 text-center text-sm text-gray-400">
            Loading photos...
          </div>
        )}
        {!loading && mediaList.length === 0 && (
          <div className="col-span-2 py-10 text-center text-sm text-gray-400">
            No media found in this cluster
          </div>
        )}
        {mediaList.map((m, idx) => {
          const isVideo = m.type === MediaType.Video
          const thumbUrl = m.thumbnail?.url || ''
          return (
            <MediaCard
              key={m.id}
              onClick={() => onSelectMedia(idx)}
              title={m.title || (isVideo ? 'Video' : 'Photo')}
            >
              {thumbUrl ? (
                <Thumbnail src={thumbUrl} alt={m.title || ''} loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  📷
                </div>
              )}
              {isVideo && <VideoIndicator>🎬</VideoIndicator>}
            </MediaCard>
          )
        })}
      </MediaGrid>
    </DrawerOverlay>
  )
}

export default PlacesMediaDrawer
