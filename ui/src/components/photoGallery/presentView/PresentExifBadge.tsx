import React from "react"
import styled from "styled-components"
import { useQuery } from "@apollo/client"
import { MediaGalleryFields } from "../__generated__/MediaGalleryFields"
import {
  sidebarMediaQuery,
  sidebarMediaQueryVariables,
} from "../../sidebar/MediaSidebar/__generated__/sidebarMediaQuery"
import { SIDEBAR_MEDIA_QUERY } from "../../sidebar/MediaSidebar/MediaSidebar"
import { MediaType } from "../../../__generated__/globalTypes"

const BadgeContainer = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
  max-width: 440px;
  background: rgba(18, 18, 20, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  padding: 12px 16px;
  z-index: 75;
  pointer-events: auto;
  transition: opacity 300ms ease, transform 300ms ease;
  user-select: none;

  &.hide {
    opacity: 0;
    pointer-events: none;
    transform: translateY(-12px);
  }
`

const CameraTitle = styled.div`
  font-size: 13.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ExifDetails = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`

const ExifPill = styled.span`
  background: rgba(255, 255, 255, 0.12);
  padding: 2px 7px;
  border-radius: 4px;
  font-family: monospace, monospace;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0 0 0 8px;
  margin-left: auto;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  transition: color 150ms ease;

  &:hover {
    color: rgba(255, 255, 255, 0.95);
  }
`

type PresentExifBadgeProps = {
  media: MediaGalleryFields
  visible: boolean
  hideControls?: boolean
  onClose?: () => void
}

const PresentExifBadge = ({
  media,
  visible,
  hideControls = false,
  onClose,
}: PresentExifBadgeProps) => {
  const { data } = useQuery<sidebarMediaQuery, sidebarMediaQueryVariables>(
    SIDEBAR_MEDIA_QUERY,
    {
      variables: { id: media.id },
      fetchPolicy: "cache-first",
    }
  )

  if (!visible) return null

  const isVideo = media.type === MediaType.Video
  const exif = data?.media?.exif
  const videoMeta = data?.media?.videoMetadata

  const camera = exif?.camera || exif?.maker || data?.media?.title || media.title
  const lens = exif?.lens
  const aperture = exif?.aperture ? `f/${exif.aperture}` : null
  const exposure = exif?.exposure ? `${exif.exposure}s` : null
  const iso = exif?.iso ? `ISO ${exif.iso}` : null
  const focalLength = exif?.focalLength ? `${exif.focalLength}mm` : null

  // Video specifics
  const resolution = videoMeta?.width && videoMeta?.height
    ? `${videoMeta.width}x${videoMeta.height}${videoMeta.width >= 3840 ? ' (4K)' : videoMeta.width >= 1920 ? ' (1080p)' : ''}`
    : null
  const fps = videoMeta?.framerate ? `${Math.round(videoMeta.framerate)} fps` : null
  const codec = videoMeta?.codec ? videoMeta.codec.toUpperCase() : null
  const duration = videoMeta?.duration
    ? `${Math.floor(videoMeta.duration / 60)}:${String(Math.floor(videoMeta.duration % 60)).padStart(2, '0')}`
    : null

  const dateShot = exif?.dateShot
    ? new Date(exif.dateShot).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  const hasExif = aperture || exposure || iso || focalLength || lens
  const hasVideoInfo = resolution || fps || codec || duration

  return (
    <BadgeContainer className={hideControls ? "hide" : undefined}>
      <CameraTitle title={camera || (isVideo ? "Video" : "Photo")}>
        <span style={{ fontSize: "15px" }}>{isVideo ? "🎬" : "📷"}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {camera || (isVideo ? "Video" : "Photo")}
        </span>
        {lens && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.55)",
              marginLeft: "4px",
            }}
          >
            ({lens})
          </span>
        )}
        {onClose && (
          <CloseButton onClick={onClose} aria-label="Close details" title="Close details">
            ✕
          </CloseButton>
        )}
      </CameraTitle>

      {isVideo && hasVideoInfo && (
        <ExifDetails>
          {resolution && <ExifPill>{resolution}</ExifPill>}
          {fps && <ExifPill>{fps}</ExifPill>}
          {codec && <ExifPill>{codec}</ExifPill>}
          {duration && <ExifPill>⏱ {duration}</ExifPill>}
        </ExifDetails>
      )}

      {hasExif && (
        <ExifDetails>
          {aperture && <ExifPill>{aperture}</ExifPill>}
          {exposure && <ExifPill>{exposure}</ExifPill>}
          {focalLength && <ExifPill>{focalLength}</ExifPill>}
          {iso && <ExifPill>{iso}</ExifPill>}
        </ExifDetails>
      )}

      {dateShot && (
        <div
          style={{
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.5)",
            marginTop: "6px",
          }}
        >
          {dateShot}
        </div>
      )}
    </BadgeContainer>
  )
}

export default PresentExifBadge
