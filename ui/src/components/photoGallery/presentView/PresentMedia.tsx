import React, { useRef, useEffect, useState } from "react"
import styled from "styled-components"
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchContentRef,
  ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch"
import { useQuery } from "@apollo/client"
import { MediaType } from "../../../__generated__/globalTypes"
import { exhaustiveCheck } from "../../../helpers/utils"
import { ProtectedImage, ProtectedVideo } from "../ProtectedMedia"
import { MediaGalleryFields } from "../__generated__/MediaGalleryFields"
import { SIDEBAR_DOWNLOAD_QUERY } from "../../sidebar/SidebarDownloadMedia"
import {
  sidebarDownloadQuery,
  sidebarDownloadQueryVariables,
} from "../../sidebar/__generated__/sidebarDownloadQuery"

import ZoomInIcon from "./icons/ZoomIn"
import ZoomOutIcon from "./icons/ZoomOut"
import ZoomResetIcon from "./icons/ZoomReset"
import RotateIcon from "./icons/Rotate"
import InfoIcon from "./icons/InfoIcon"
import FilmstripIcon from "./icons/Filmstrip"
import EditIcon from "./icons/EditIcon"
import PresentExifBadge from "./PresentExifBadge"
import PresentFilmstrip from "./PresentFilmstrip"

const StyledPhoto = styled(ProtectedImage)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  user-select: none;
  -webkit-user-drag: none;
`

const StyledVideo = styled(ProtectedVideo)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
`

const ZoomToolbar = styled.div`
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(18, 18, 20, 0.78);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border-radius: 9999px;
  padding: 4px 12px;
  z-index: 55;
  transition: opacity 300ms ease, transform 300ms ease;

  &.hide {
    opacity: 0;
    pointer-events: none;
    transform: translateX(-50%) translateY(12px);
  }
`

const ZoomToolbarButton = styled.button<{ active?: boolean }>`
  background: ${({ active }) =>
    active ? "rgba(255, 255, 255, 0.22)" : "none"};
  border: none;
  outline: none;
  color: ${({ active }) =>
    active ? "#ffffff" : "rgba(255, 255, 255, 0.8)"};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background 150ms ease, color 150ms ease, opacity 150ms ease;

  & svg {
    width: 20px;
    height: 20px;
  }

  & svg path,
  & svg circle,
  & svg line,
  & svg rect {
    stroke: currentColor;
  }

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.22);
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`

const ToolbarDivider = styled.div`
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.16);
  margin: 0 2px;
`

const HdButton = styled.button<{ active?: boolean }>`
  background: ${({ active }) =>
    active ? "rgba(59, 130, 246, 0.3)" : "none"};
  border: 1px solid
    ${({ active }) =>
      active ? "rgba(96, 165, 250, 0.8)" : "rgba(255, 255, 255, 0.25)"};
  outline: none;
  color: ${({ active }) => (active ? "#93c5fd" : "rgba(255, 255, 255, 0.85)")};
  font-size: 11px;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.5px;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 6px;
  transition: all 150ms ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${({ active }) =>
      active ? "rgba(59, 130, 246, 0.45)" : "rgba(255, 255, 255, 0.18)"};
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.6);
  }
`

const ZoomScaleLabel = styled.button`
  background: none;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  padding: 4px 6px;
  min-width: 48px;
  text-align: center;
  border-radius: 6px;
  transition: background 150ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }
`

type PresentMediaProps = {
  media: MediaGalleryFields
  imageLoaded?(): void
  hideControls?: boolean
  rotation?: number
  onRotate?: () => void
  showExif?: boolean
  onToggleExif?: () => void
  showFilmstrip?: boolean
  onToggleFilmstrip?: () => void
  onToggleEdit?: () => void
  mediaList?: MediaGalleryFields[]
  onSelectMedia?: (media: MediaGalleryFields, index: number) => void
}

const PresentMedia = ({
  media,
  imageLoaded,
  hideControls = false,
  rotation = 0,
  onRotate,
  showExif = false,
  onToggleExif,
  showFilmstrip = false,
  onToggleFilmstrip,
  onToggleEdit,
  mediaList,
  onSelectMedia,
  ...otherProps
}: PresentMediaProps & Record<string, any>) => {
  const transformComponentRef = useRef<ReactZoomPanPinchContentRef | null>(null)
  const [scale, setScale] = useState(1)
  const [loadHd, setLoadHd] = useState(false)
  const [hdLoaded, setHdLoaded] = useState(false)
  const [windowSize, setWindowSize] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 1920,
    h: typeof window !== "undefined" ? window.innerHeight : 1080,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight })
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Reset zoom & HD state whenever media changes
  useEffect(() => {
    transformComponentRef.current?.resetTransform()
    setScale(1)
    setLoadHd(false)
    setHdLoaded(false)
  }, [media.id])

  // Query downloads when HD is requested
  const { data: downloadData, loading: downloadLoading } = useQuery<
    sidebarDownloadQuery,
    sidebarDownloadQueryVariables
  >(SIDEBAR_DOWNLOAD_QUERY, {
    variables: { mediaId: media.id },
    skip: !loadHd,
    fetchPolicy: "cache-first",
  })

  // Extract master download URL
  const downloads = downloadData?.media?.downloads
  const masterDownload =
    downloads?.find(d => d.title.toLowerCase().includes("original")) ||
    (downloads && downloads.length > 0
      ? [...downloads].sort(
          (a, b) => (b.mediaUrl.fileSize || 0) - (a.mediaUrl.fileSize || 0)
        )[0]
      : null)
  const masterUrl = masterDownload?.mediaUrl?.url

  const isRotatedSideways = rotation % 180 !== 0
  const sidewaysScale = isRotatedSideways
    ? Math.min(windowSize.w / windowSize.h, windowSize.h / windowSize.w)
    : 1

  const handleRotateClick = () => {
    transformComponentRef.current?.resetTransform()
    setScale(1)
    onRotate && onRotate()
  }

  switch (media.type) {
    case MediaType.Photo:
      return (
        <div
          {...otherProps}
          style={{ width: "100vw", height: "100vh", position: "relative" }}
        >
          <TransformWrapper
            ref={transformComponentRef}
            initialScale={1}
            minScale={1}
            maxScale={8}
            centerOnInit
            wheel={{ step: 0.08 }}
            pinch={{ step: 1 }}
            doubleClick={{ mode: "toggle", step: 2 }}
            panning={{ disabled: scale <= 1 }}
            onTransform={(_ref: ReactZoomPanPinchRef, state: { scale: number }) => {
              setScale(state.scale)
            }}
          >
            {({ zoomIn, zoomOut, resetTransform, state }) => (
              <>
                <TransformComponent
                  wrapperStyle={{
                    width: "100vw",
                    height: "100vh",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                  contentStyle={{
                    width: "100vw",
                    height: "100vh",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "100vw",
                      height: "100vh",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `rotate(${rotation}deg) scale(${sidewaysScale})`,
                      transformOrigin: "center center",
                      transition: "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
                    }}
                  >
                    <StyledPhoto
                      key={`${media.id}-thumb`}
                      src={media.thumbnail?.url}
                      data-testid="present-img-thumbnail"
                    />
                    <StyledPhoto
                      key={`${media.id}-highres`}
                      style={{ display: "none" }}
                      src={media.highRes?.url}
                      data-testid="present-img-highres"
                      onLoad={e => {
                        const elem = e.target as HTMLImageElement
                        elem.style.display = "initial"
                        imageLoaded && imageLoaded()
                      }}
                    />
                    {loadHd && masterUrl && (
                      <StyledPhoto
                        key={`${media.id}-master`}
                        style={{ display: hdLoaded ? "initial" : "none" }}
                        src={masterUrl}
                        data-testid="present-img-master"
                        onLoad={() => setHdLoaded(true)}
                      />
                    )}
                  </div>
                </TransformComponent>

                {/* Bottom Filmstrip */}
                {mediaList && onSelectMedia && (
                  <PresentFilmstrip
                    mediaList={mediaList}
                    activeMedia={media}
                    visible={showFilmstrip}
                    hideControls={hideControls}
                    onSelectMedia={onSelectMedia}
                  />
                )}

                {/* Floating Bottom Toolbar */}
                <ZoomToolbar className={hideControls ? "hide" : undefined}>
                  {onToggleEdit && (
                    <ZoomToolbarButton
                      aria-label="Edit photo"
                      title="Open photo editor (e)"
                      onClick={onToggleEdit}
                    >
                      <EditIcon />
                    </ZoomToolbarButton>
                  )}

                  {onRotate && (
                    <ZoomToolbarButton
                      aria-label="Rotate image"
                      title="Rotate 90° clockwise (r)"
                      onClick={handleRotateClick}
                    >
                      <RotateIcon />
                    </ZoomToolbarButton>
                  )}

                  <ToolbarDivider />

                  <ZoomToolbarButton
                    aria-label="Zoom out"
                    title="Zoom out (-)"
                    onClick={() => zoomOut(0.4)}
                    disabled={state.scale <= 1}
                  >
                    <ZoomOutIcon />
                  </ZoomToolbarButton>

                  <ZoomScaleLabel
                    aria-label="Reset zoom"
                    title="Click to reset zoom"
                    onClick={() => resetTransform()}
                  >
                    {Math.round(state.scale * 100)}%
                  </ZoomScaleLabel>

                  <ZoomToolbarButton
                    aria-label="Zoom in"
                    title="Zoom in (+)"
                    onClick={() => zoomIn(0.4)}
                    disabled={state.scale >= 8}
                  >
                    <ZoomInIcon />
                  </ZoomToolbarButton>

                  {state.scale > 1 && (
                    <ZoomToolbarButton
                      aria-label="Fit to screen"
                      title="Fit to screen"
                      onClick={() => resetTransform()}
                    >
                      <ZoomResetIcon />
                    </ZoomToolbarButton>
                  )}

                  <ToolbarDivider />

                  {/* On-Demand HD Master button */}
                  <HdButton
                    active={loadHd}
                    title={
                      hdLoaded
                        ? "Master resolution loaded"
                        : loadHd && downloadLoading
                        ? "Loading original master..."
                        : "Load original master quality"
                    }
                    onClick={() => {
                      if (!loadHd) {
                        setLoadHd(true)
                      }
                    }}
                  >
                    {hdLoaded ? "HD ✓" : loadHd ? "HD..." : "HD"}
                  </HdButton>

                  <ToolbarDivider />

                  {/* EXIF Info HUD Toggle */}
                  {onToggleExif && (
                    <ZoomToolbarButton
                      active={showExif}
                      aria-label="Toggle EXIF info"
                      title="Toggle EXIF metadata HUD (i)"
                      onClick={onToggleExif}
                    >
                      <InfoIcon />
                    </ZoomToolbarButton>
                  )}

                  {/* Filmstrip Toggle */}
                  {mediaList && onToggleFilmstrip && (
                    <ZoomToolbarButton
                      active={showFilmstrip}
                      aria-label="Toggle Filmstrip"
                      title="Toggle thumbnail filmstrip (f)"
                      onClick={onToggleFilmstrip}
                    >
                      <FilmstripIcon />
                    </ZoomToolbarButton>
                  )}
                </ZoomToolbar>

                {/* EXIF Metadata HUD Badge */}
                <PresentExifBadge
                  media={media}
                  visible={showExif}
                  hideControls={hideControls}
                />
              </>
            )}
          </TransformWrapper>
        </div>
      )
    case MediaType.Video:
      return <StyledVideo media={media} data-testid="present-video" />
  }

  exhaustiveCheck(media.type)
}

export default PresentMedia
