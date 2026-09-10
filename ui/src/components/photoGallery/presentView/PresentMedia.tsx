import React, { useRef, useEffect, useState } from 'react'
import styled from 'styled-components'
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchContentRef,
  ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch'
import { MediaType } from '../../../__generated__/globalTypes'
import { exhaustiveCheck } from '../../../helpers/utils'
import { ProtectedImage, ProtectedVideo } from '../ProtectedMedia'
import { MediaGalleryFields } from '../__generated__/MediaGalleryFields'
import ZoomInIcon from './icons/ZoomIn'
import ZoomOutIcon from './icons/ZoomOut'
import ZoomResetIcon from './icons/ZoomReset'

const StyledPhoto = styled(ProtectedImage)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
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
  gap: 8px;
  background: rgba(18, 18, 20, 0.78);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border-radius: 9999px;
  padding: 4px 14px;
  z-index: 55;
  transition: opacity 300ms ease, transform 300ms ease;

  &.hide {
    opacity: 0;
    pointer-events: none;
    transform: translateX(-50%) translateY(12px);
  }
`

const ZoomToolbarButton = styled.button`
  background: none;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.8);
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
  & svg circle {
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

const ZoomScaleLabel = styled.button`
  background: none;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  padding: 4px 8px;
  min-width: 52px;
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
}

const PresentMedia = ({
  media,
  imageLoaded,
  hideControls = false,
  ...otherProps
}: PresentMediaProps & Record<string, any>) => {
  const transformComponentRef = useRef<ReactZoomPanPinchContentRef | null>(null)
  const [scale, setScale] = useState(1)

  // Reset zoom to 1x whenever media changes
  useEffect(() => {
    transformComponentRef.current?.resetTransform()
    setScale(1)
  }, [media.id])

  switch (media.type) {
    case MediaType.Photo:
      return (
        <div {...otherProps} style={{ width: '100vw', height: '100vh', position: 'relative' }}>
          <TransformWrapper
            ref={transformComponentRef}
            initialScale={1}
            minScale={1}
            maxScale={8}
            centerOnInit
            wheel={{ step: 0.15 }}
            doubleClick={{ mode: 'toggle', step: 2 }}
            panning={{ disabled: scale <= 1 }}
            onTransform={(_ref: ReactZoomPanPinchRef, state: { scale: number }) => {
              setScale(state.scale)
            }}
          >
            {({ zoomIn, zoomOut, resetTransform, state }) => (
              <>
                <TransformComponent
                  wrapperStyle={{
                    width: '100vw',
                    height: '100vh',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                  contentStyle={{
                    width: '100vw',
                    height: '100vh',
                    position: 'relative',
                  }}
                >
                  <StyledPhoto
                    key={`${media.id}-thumb`}
                    src={media.thumbnail?.url}
                    data-testid="present-img-thumbnail"
                  />
                  <StyledPhoto
                    key={`${media.id}-highres`}
                    style={{ display: 'none' }}
                    src={media.highRes?.url}
                    data-testid="present-img-highres"
                    onLoad={e => {
                      const elem = e.target as HTMLImageElement
                      elem.style.display = 'initial'
                      imageLoaded && imageLoaded()
                    }}
                  />
                </TransformComponent>

                <ZoomToolbar className={hideControls ? 'hide' : undefined}>
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
                </ZoomToolbar>
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
