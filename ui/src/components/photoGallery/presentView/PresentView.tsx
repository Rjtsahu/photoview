import React, { useEffect, useState } from "react"
import styled, { createGlobalStyle } from "styled-components"
import PresentNavigationOverlay from "./PresentNavigationOverlay"
import PresentMedia from "./PresentMedia"
import { closePresentModeAction, GalleryAction } from "../mediaGalleryReducer"
import { MediaGalleryFields } from "../__generated__/MediaGalleryFields"

const StyledContainer = styled.div`
  position: fixed;
  width: 100vw;
  height: 100vh;
  background-color: black;
  color: white;
  top: 0;
  left: 0;
  z-index: 100;
`

const PreventScroll = createGlobalStyle`
  * {
    overflow: hidden !important;
  }
`

type PresentViewProps = {
  className?: string
  imageLoaded?(): void
  activeMedia: MediaGalleryFields
  dispatchMedia: React.Dispatch<GalleryAction>
  disableSaveCloseInHistory?: boolean
  mediaList?: MediaGalleryFields[]
  onSelectMedia?: (media: MediaGalleryFields, index: number) => void
}

const PresentView = ({
  className,
  imageLoaded,
  activeMedia,
  dispatchMedia,
  disableSaveCloseInHistory,
  mediaList,
  onSelectMedia,
}: PresentViewProps) => {
  const [rotation, setRotation] = useState(0)
  const [showExif, setShowExif] = useState(false)
  const [showFilmstrip, setShowFilmstrip] = useState(true)

  // Reset rotation when media changes
  useEffect(() => {
    setRotation(0)
  }, [activeMedia.id])

  useEffect(() => {
    const keyDownEvent = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.stopPropagation()
        dispatchMedia({ type: "nextImage" })
      }

      if (e.key === "ArrowLeft") {
        e.stopPropagation()
        dispatchMedia({ type: "previousImage" })
      }

      if (e.key === "Escape") {
        e.stopPropagation()

        if (disableSaveCloseInHistory === true) {
          dispatchMedia({ type: "closePresentMode" })
        } else {
          closePresentModeAction({ dispatchMedia })
        }
      }

      if (e.key === "r" || e.key === "R") {
        e.stopPropagation()
        setRotation(r => (r + 90) % 360)
      }

      if (e.key === "i" || e.key === "I") {
        e.stopPropagation()
        setShowExif(s => !s)
      }

      if (e.key === "f" || e.key === "F") {
        e.stopPropagation()
        setShowFilmstrip(s => !s)
      }
    }

    document.addEventListener("keydown", keyDownEvent)

    return function cleanup() {
      document.removeEventListener("keydown", keyDownEvent)
    }
  }, [dispatchMedia, disableSaveCloseInHistory])

  return (
    <StyledContainer className={className}>
      <PreventScroll />
      <PresentNavigationOverlay
        dispatchMedia={dispatchMedia}
        disableSaveCloseInHistory
      >
        <PresentMedia
          media={activeMedia}
          imageLoaded={imageLoaded}
          rotation={rotation}
          onRotate={() => setRotation(r => (r + 90) % 360)}
          showExif={showExif}
          onToggleExif={() => setShowExif(s => !s)}
          showFilmstrip={showFilmstrip}
          onToggleFilmstrip={() => setShowFilmstrip(s => !s)}
          mediaList={mediaList}
          onSelectMedia={onSelectMedia}
        />
      </PresentNavigationOverlay>
    </StyledContainer>
  )
}

export default PresentView
