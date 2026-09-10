import React from "react"
import styled from "styled-components"
import { useQuery } from "@apollo/client"
import { MediaGalleryFields } from "../__generated__/MediaGalleryFields"
import {
  sidebarMediaQuery,
  sidebarMediaQueryVariables,
} from "../../sidebar/MediaSidebar/__generated__/sidebarMediaQuery"
import { SIDEBAR_MEDIA_QUERY } from "../../sidebar/MediaSidebar/MediaSidebar"

const BadgeContainer = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
  max-width: 420px;
  background: rgba(18, 18, 20, 0.78);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  padding: 10px 14px;
  z-index: 55;
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
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ExifDetails = styled.div`
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`

const ExifPill = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace, monospace;
  font-size: 11px;
`

type PresentExifBadgeProps = {
  media: MediaGalleryFields
  visible: boolean
  hideControls: boolean
}

const PresentExifBadge = ({
  media,
  visible,
  hideControls,
}: PresentExifBadgeProps) => {
  const { data } = useQuery<sidebarMediaQuery, sidebarMediaQueryVariables>(
    SIDEBAR_MEDIA_QUERY,
    {
      variables: { id: media.id },
      fetchPolicy: "cache-first",
    }
  )

  if (!visible) return null

  const exif = data?.media?.exif
  const camera = exif?.camera || exif?.maker || data?.media?.title || media.title
  const lens = exif?.lens
  const aperture = exif?.aperture ? `f/${exif.aperture}` : null
  const exposure = exif?.exposure ? `${exif.exposure}s` : null
  const iso = exif?.iso ? `ISO ${exif.iso}` : null
  const focalLength = exif?.focalLength ? `${exif.focalLength}mm` : null
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

  return (
    <BadgeContainer className={hideControls ? "hide" : undefined}>
      <CameraTitle title={camera || "Photo"}>
        <span style={{ fontSize: "14px" }}>📷</span>
        <span>{camera || "Photo"}</span>
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
      </CameraTitle>
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
            fontSize: "10.5px",
            color: "rgba(255, 255, 255, 0.45)",
            marginTop: "4px",
          }}
        >
          {dateShot}
        </div>
      )}
    </BadgeContainer>
  )
}

export default PresentExifBadge
