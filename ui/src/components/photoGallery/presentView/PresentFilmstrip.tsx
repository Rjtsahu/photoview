import React, { useEffect, useRef } from "react"
import styled from "styled-components"
import { MediaGalleryFields } from "../__generated__/MediaGalleryFields"
import { ProtectedImage } from "../ProtectedMedia"

const StripContainer = styled.div`
  position: absolute;
  bottom: 74px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 80vw;
  height: 68px;
  background: rgba(18, 18, 20, 0.78);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.55);
  border-radius: 12px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  z-index: 54;
  transition: opacity 300ms ease, transform 300ms ease;
  pointer-events: auto;

  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }

  &.hide {
    opacity: 0;
    pointer-events: none;
    transform: translateX(-50%) translateY(12px);
  }
`

const ThumbItem = styled.button<{ isActive: boolean }>`
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #111;
  cursor: pointer;
  padding: 0;
  border: 2px solid
    ${({ isActive }) =>
      isActive ? "#3b82f6" : "rgba(255, 255, 255, 0.18)"};
  opacity: ${({ isActive }) => (isActive ? 1 : 0.65)};
  transform: ${({ isActive }) => (isActive ? "scale(1.08)" : "scale(1)")};
  transition: transform 150ms ease, border-color 150ms ease, opacity 150ms ease;

  &:hover {
    opacity: 1;
    border-color: ${({ isActive }) =>
      isActive ? "#60a5fa" : "rgba(255, 255, 255, 0.6)"};
  }

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`

type PresentFilmstripProps = {
  mediaList: MediaGalleryFields[]
  activeMedia: MediaGalleryFields
  visible: boolean
  hideControls: boolean
  onSelectMedia: (media: MediaGalleryFields, index: number) => void
}

const PresentFilmstrip = ({
  mediaList,
  activeMedia,
  visible,
  hideControls,
  onSelectMedia,
}: PresentFilmstripProps) => {
  const activeThumbRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (visible && activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      })
    }
  }, [activeMedia.id, visible])

  if (!visible || !mediaList || mediaList.length <= 1) return null

  return (
    <StripContainer
      className={hideControls ? "hide" : undefined}
      data-testid="present-filmstrip"
      onClick={e => e.stopPropagation()}
    >
      {mediaList.map((item, index) => {
        const isActive = item.id === activeMedia.id
        return (
          <ThumbItem
            key={item.id}
            ref={isActive ? activeThumbRef : null}
            isActive={isActive}
            title={item.title || `Image ${index + 1}`}
            onClick={e => {
              e.stopPropagation()
              onSelectMedia(item, index)
            }}
          >
            <ProtectedImage src={item.thumbnail?.url} />
          </ThumbItem>
        )
      })}
    </StripContainer>
  )
}

export default PresentFilmstrip
