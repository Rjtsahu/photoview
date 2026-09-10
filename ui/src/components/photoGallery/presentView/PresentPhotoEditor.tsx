import React, { useState, useRef, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import {
  ImageAdjustments,
  DEFAULT_ADJUSTMENTS,
  CropRect,
  DEFAULT_CROP,
  AspectRatioType,
  FILTER_PRESETS,
  getFilterCssString,
  exportEditedImage,
} from './editorUtils'
import { MediaGalleryFields } from '../__generated__/MediaGalleryFields'

const EditorContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #0b0f19;
  color: #f8fafc;
  z-index: 120;
  display: flex;
  flex-direction: column;
  user-select: none;
`

// --- Top Action Bar ---
const TopBar = styled.header`
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 30;
`

const TopBarTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #f1f5f9;

  span.badge {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const HeaderButton = styled.button<{ $variant?: 'primary' | 'ghost' | 'active' }>`
  background: ${({ $variant }) =>
    $variant === 'primary'
      ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
      : $variant === 'active'
      ? 'rgba(56, 189, 248, 0.2)'
      : 'rgba(255, 255, 255, 0.06)'};
  color: ${({ $variant }) =>
    $variant === 'primary' ? '#ffffff' : $variant === 'active' ? '#38bdf8' : '#e2e8f0'};
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'primary'
        ? 'rgba(56, 189, 248, 0.4)'
        : $variant === 'active'
        ? 'rgba(56, 189, 248, 0.4)'
        : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 160ms cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    background: ${({ $variant }) =>
      $variant === 'primary'
        ? 'linear-gradient(135deg, #0369a1 0%, #075985 100%)'
        : 'rgba(255, 255, 255, 0.12)'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

// --- Center Canvas Area ---
const CanvasViewport = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const ImageWrapper = styled.div<{ $rotation: number; $flipH: boolean; $flipV: boolean }>`
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: 100%;
  transform: rotate(${({ $rotation }) => $rotation}deg)
    scaleX(${({ $flipH }) => ($flipH ? -1 : 1)})
    scaleY(${({ $flipV }) => ($flipV ? -1 : 1)});
  transform-origin: center center;
  transition: transform 180ms ease-out;
`

const EditorImage = styled.img<{ $filter: string }>`
  display: block;
  max-width: calc(100vw - 64px);
  max-height: calc(100vh - 270px);
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08);
  filter: ${({ $filter }) => $filter};
  transition: filter 60ms linear;
`

// --- Crop Overlay Styles ---
const CropMaskOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
`

const CropBox = styled.div<{ $rect: CropRect }>`
  position: absolute;
  left: ${({ $rect }) => $rect.x * 100}%;
  top: ${({ $rect }) => $rect.y * 100}%;
  width: ${({ $rect }) => $rect.width * 100}%;
  height: ${({ $rect }) => $rect.height * 100}%;
  border: 2px solid #38bdf8;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  pointer-events: auto;
  cursor: move;
  box-sizing: border-box;

  /* Grid lines */
  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
  }
  &::before {
    left: 33.33%;
    right: 33.33%;
    top: 0;
    bottom: 0;
    border-left: 1px dashed rgba(255, 255, 255, 0.35);
    border-right: 1px dashed rgba(255, 255, 255, 0.35);
  }
  &::after {
    top: 33.33%;
    bottom: 33.33%;
    left: 0;
    right: 0;
    border-top: 1px dashed rgba(255, 255, 255, 0.35);
    border-bottom: 1px dashed rgba(255, 255, 255, 0.35);
  }
`

const CropHandle = styled.div<{ $pos: string }>`
  position: absolute;
  width: 14px;
  height: 14px;
  background-color: #38bdf8;
  border: 2px solid #0f172a;
  border-radius: 2px;
  z-index: 10;

  ${({ $pos }) => {
    switch ($pos) {
      case 'nw':
        return 'top: -7px; left: -7px; cursor: nwse-resize;'
      case 'ne':
        return 'top: -7px; right: -7px; cursor: nesw-resize;'
      case 'sw':
        return 'bottom: -7px; left: -7px; cursor: nesw-resize;'
      case 'se':
        return 'bottom: -7px; right: -7px; cursor: nwse-resize;'
      case 'n':
        return 'top: -7px; left: calc(50% - 7px); cursor: ns-resize;'
      case 's':
        return 'bottom: -7px; left: calc(50% - 7px); cursor: ns-resize;'
      case 'w':
        return 'top: calc(50% - 7px); left: -7px; cursor: ew-resize;'
      case 'e':
        return 'top: calc(50% - 7px); right: -7px; cursor: ew-resize;'
      default:
        return ''
    }
  }}
`

// --- Bottom Control Panel ---
const BottomPanel = styled.div`
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  z-index: 30;
  max-height: 220px;
`

const TabHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`

const TabButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? 'rgba(56, 189, 248, 0.16)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#38bdf8' : '#94a3b8')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(56, 189, 248, 0.3)' : 'transparent')};
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 140ms ease;

  &:hover {
    color: #f1f5f9;
    background: ${({ $active }) => ($active ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)')};
  }
`

const TabContent = styled.div`
  padding: 16px 24px;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  align-items: center;
`

// Adjustments Sliders
const SlidersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px 32px;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
`

const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const SliderLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: #cbd5e1;

  span.val {
    color: #38bdf8;
    font-variant-numeric: tabular-nums;
  }
`

const StyledSlider = styled.input`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
    cursor: pointer;
    transition: transform 120ms ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }
`

// Filters Presets Row
const FiltersRow = styled.div`
  display: flex;
  gap: 12px;
  margin: 0 auto;
  padding: 4px 0;
`

const FilterCard = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)'};
  border: 1.5px solid
    ${({ $active }) => ($active ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)')};
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  min-width: 80px;
  transition: all 140ms ease;

  &:hover {
    border-color: rgba(56, 189, 248, 0.6);
    transform: translateY(-2px);
  }

  span.name {
    font-size: 11px;
    font-weight: 600;
    color: ${({ $active }) => ($active ? '#38bdf8' : '#e2e8f0')};
  }
`

const FilterPreviewCircle = styled.div<{ $filter: string }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #3b82f6 100%);
  filter: ${({ $filter }) => $filter};
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
`

// Crop & Transform Bar
const TransformBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
`

const AspectGroup = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 3px;
  gap: 4px;
`

const AspectButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? '#38bdf8' : 'transparent')};
  color: ${({ $active }) => ($active ? '#0f172a' : '#cbd5e1')};
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 120ms ease;

  &:hover {
    color: ${({ $active }) => ($active ? '#0f172a' : '#ffffff')};
  }
`

// --- Component Props ---
type PresentPhotoEditorProps = {
  media: MediaGalleryFields
  onClose(): void
}

type TabType = 'adjust' | 'filters' | 'crop'

const PresentPhotoEditor = ({ media, onClose }: PresentPhotoEditorProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('adjust')
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS)
  const [activeFilterId, setActiveFilterId] = useState<string>('original')
  const [rotation, setRotation] = useState<number>(0)
  const [flipH, setFlipH] = useState<boolean>(false)
  const [flipV, setFlipV] = useState<boolean>(false)
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('free')
  const [crop, setCrop] = useState<CropRect>(DEFAULT_CROP)
  const [showOriginal, setShowOriginal] = useState<boolean>(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    type: string // 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e'
    startX: number
    startY: number
    initialCrop: CropRect
    containerWidth: number
    containerHeight: number
  } | null>(null)

  // Choose the best image URL: high-res if available, else thumbnail
  const imageUrl = media.highRes?.url || media.thumbnail?.url || ''

  // Filter CSS string for the main preview
  const currentFilterCss = showOriginal ? 'none' : getFilterCssString(adjustments)

  // Reset adjustments
  const handleResetAll = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS)
    setActiveFilterId('original')
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setCrop(DEFAULT_CROP)
    setAspectRatio('free')
  }

  // Apply Filter Preset
  const handleSelectFilter = (preset: typeof FILTER_PRESETS[number]) => {
    setActiveFilterId(preset.id)
    setAdjustments({
      ...DEFAULT_ADJUSTMENTS,
      ...preset.adjustments,
    })
  }

  // Update a single adjustment
  const handleAdjustmentChange = (key: keyof ImageAdjustments, value: number) => {
    setActiveFilterId('custom')
    setAdjustments(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  // Crop Aspect Ratio Presets
  const applyAspectRatio = (type: AspectRatioType) => {
    setAspectRatio(type)
    if (type === 'free') return

    const img = imgRef.current
    if (!img) return

    const imgW = img.clientWidth
    const imgH = img.clientHeight
    let targetRatio = 1

    switch (type) {
      case '1:1':
        targetRatio = 1
        break
      case '4:3':
        targetRatio = 4 / 3
        break
      case '16:9':
        targetRatio = 16 / 9
        break
      case '3:4':
        targetRatio = 3 / 4
        break
      case '9:16':
        targetRatio = 9 / 16
        break
      case 'original':
        targetRatio = (img.naturalWidth || imgW) / (img.naturalHeight || imgH)
        break
    }

    const currentImgRatio = imgW / imgH
    let newWidth = 1
    let newHeight = 1

    if (targetRatio > currentImgRatio) {
      newWidth = 1
      newHeight = currentImgRatio / targetRatio
    } else {
      newHeight = 1
      newWidth = targetRatio / currentImgRatio
    }

    setCrop({
      x: (1 - newWidth) / 2,
      y: (1 - newHeight) / 2,
      width: Math.min(1, Math.max(0.1, newWidth)),
      height: Math.min(1, Math.max(0.1, newHeight)),
    })
  }

  // Dragging logic for Crop box and handles
  const handlePointerDown = (e: React.PointerEvent, handleType: string) => {
    e.preventDefault()
    e.stopPropagation()

    const container = imageContainerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    dragRef.current = {
      type: handleType,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
      containerWidth: rect.width,
      containerHeight: rect.height,
    }

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return
      const { type, startX, startY, initialCrop, containerWidth, containerHeight } =
        dragRef.current

      const dx = (moveEvent.clientX - startX) / containerWidth
      const dy = (moveEvent.clientY - startY) / containerHeight

      setCrop(prev => {
        let { x, y, width, height } = initialCrop
        const minSize = 0.08

        if (type === 'move') {
          x = Math.max(0, Math.min(1 - width, x + dx))
          y = Math.max(0, Math.min(1 - height, y + dy))
        } else {
          if (type.includes('w')) {
            const nextX = Math.min(initialCrop.x + initialCrop.width - minSize, initialCrop.x + dx)
            const clampedX = Math.max(0, nextX)
            width = initialCrop.x + initialCrop.width - clampedX
            x = clampedX
          }
          if (type.includes('e')) {
            width = Math.max(minSize, Math.min(1 - initialCrop.x, initialCrop.width + dx))
          }
          if (type.includes('n')) {
            const nextY = Math.min(initialCrop.y + initialCrop.height - minSize, initialCrop.y + dy)
            const clampedY = Math.max(0, nextY)
            height = initialCrop.y + initialCrop.height - clampedY
            y = clampedY
          }
          if (type.includes('s')) {
            height = Math.max(minSize, Math.min(1 - initialCrop.y, initialCrop.height + dy))
          }
        }

        return { x, y, width, height }
      })
    }

    const onPointerUp = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  // Handle Export / Download
  const handleExport = async () => {
    if (!imgRef.current) return
    try {
      setIsExporting(true)
      await exportEditedImage(
        imgRef.current,
        media.title || 'photo.jpg',
        adjustments,
        rotation,
        flipH,
        flipV,
        crop
      )
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <EditorContainer data-testid="present-photo-editor">
      {/* Top Header */}
      <TopBar>
        <TopBarTitle>
          <span>{media.title || 'Photo'}</span>
          <span className="badge">Edit Studio</span>
        </TopBarTitle>

        <ButtonGroup>
          <HeaderButton
            $variant="ghost"
            title="Hold to view original (before edits)"
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
          >
            {showOriginal ? 'Showing Original' : 'Hold for Original'}
          </HeaderButton>

          <HeaderButton $variant="ghost" onClick={handleResetAll} title="Reset all edits">
            Reset
          </HeaderButton>

          <HeaderButton
            $variant="primary"
            onClick={handleExport}
            disabled={isExporting}
            title="Export and download edited photo"
          >
            {isExporting ? 'Exporting...' : 'Export & Save'}
          </HeaderButton>

          <HeaderButton $variant="ghost" onClick={onClose} title="Exit Editor">
            Done
          </HeaderButton>
        </ButtonGroup>
      </TopBar>

      {/* Main Canvas Viewport */}
      <CanvasViewport>
        <ImageWrapper
          ref={imageContainerRef}
          $rotation={rotation}
          $flipH={flipH}
          $flipV={flipV}
        >
          <EditorImage
            ref={imgRef}
            src={imageUrl}
            crossOrigin="anonymous"
            $filter={currentFilterCss}
            alt={media.title || 'Photo to edit'}
          />

          {/* Interactive Crop Box (Active when Crop tab is selected) */}
          {activeTab === 'crop' && (
            <CropMaskOverlay>
              <CropBox
                $rect={crop}
                onPointerDown={e => handlePointerDown(e, 'move')}
              >
                <CropHandle $pos="nw" onPointerDown={e => handlePointerDown(e, 'nw')} />
                <CropHandle $pos="ne" onPointerDown={e => handlePointerDown(e, 'ne')} />
                <CropHandle $pos="sw" onPointerDown={e => handlePointerDown(e, 'sw')} />
                <CropHandle $pos="se" onPointerDown={e => handlePointerDown(e, 'se')} />
                <CropHandle $pos="n" onPointerDown={e => handlePointerDown(e, 'n')} />
                <CropHandle $pos="s" onPointerDown={e => handlePointerDown(e, 's')} />
                <CropHandle $pos="w" onPointerDown={e => handlePointerDown(e, 'w')} />
                <CropHandle $pos="e" onPointerDown={e => handlePointerDown(e, 'e')} />
              </CropBox>
            </CropMaskOverlay>
          )}
        </ImageWrapper>
      </CanvasViewport>

      {/* Bottom Control Drawer */}
      <BottomPanel>
        <TabHeader>
          <TabButton
            $active={activeTab === 'adjust'}
            onClick={() => setActiveTab('adjust')}
          >
            Adjustments
          </TabButton>
          <TabButton
            $active={activeTab === 'filters'}
            onClick={() => setActiveTab('filters')}
          >
            Filters
          </TabButton>
          <TabButton
            $active={activeTab === 'crop'}
            onClick={() => setActiveTab('crop')}
          >
            Crop & Transform
          </TabButton>
        </TabHeader>

        <TabContent>
          {/* 1. Adjustments Tab */}
          {activeTab === 'adjust' && (
            <SlidersGrid>
              <SliderRow>
                <SliderLabelRow>
                  <span>Brightness</span>
                  <span className="val">{adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}</span>
                </SliderLabelRow>
                <StyledSlider
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.brightness}
                  onChange={e => handleAdjustmentChange('brightness', Number(e.target.value))}
                />
              </SliderRow>

              <SliderRow>
                <SliderLabelRow>
                  <span>Contrast</span>
                  <span className="val">{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}</span>
                </SliderLabelRow>
                <StyledSlider
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.contrast}
                  onChange={e => handleAdjustmentChange('contrast', Number(e.target.value))}
                />
              </SliderRow>

              <SliderRow>
                <SliderLabelRow>
                  <span>Saturation</span>
                  <span className="val">{adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}</span>
                </SliderLabelRow>
                <StyledSlider
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.saturation}
                  onChange={e => handleAdjustmentChange('saturation', Number(e.target.value))}
                />
              </SliderRow>

              <SliderRow>
                <SliderLabelRow>
                  <span>Warmth / Temperature</span>
                  <span className="val">{adjustments.warmth > 0 ? `+${adjustments.warmth}` : adjustments.warmth}</span>
                </SliderLabelRow>
                <StyledSlider
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.warmth}
                  onChange={e => handleAdjustmentChange('warmth', Number(e.target.value))}
                />
              </SliderRow>

              <SliderRow>
                <SliderLabelRow>
                  <span>Exposure</span>
                  <span className="val">{adjustments.exposure > 0 ? `+${adjustments.exposure}` : adjustments.exposure}</span>
                </SliderLabelRow>
                <StyledSlider
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.exposure}
                  onChange={e => handleAdjustmentChange('exposure', Number(e.target.value))}
                />
              </SliderRow>

              <SliderRow>
                <SliderLabelRow>
                  <span>Sepia</span>
                  <span className="val">{adjustments.sepia}</span>
                </SliderLabelRow>
                <StyledSlider
                  type="range"
                  min={0}
                  max={100}
                  value={adjustments.sepia}
                  onChange={e => handleAdjustmentChange('sepia', Number(e.target.value))}
                />
              </SliderRow>
            </SlidersGrid>
          )}

          {/* 2. Filters Tab */}
          {activeTab === 'filters' && (
            <FiltersRow>
              {FILTER_PRESETS.map(preset => {
                const previewFilterStr = getFilterCssString({
                  ...DEFAULT_ADJUSTMENTS,
                  ...preset.adjustments,
                })
                return (
                  <FilterCard
                    key={preset.id}
                    $active={activeFilterId === preset.id}
                    onClick={() => handleSelectFilter(preset)}
                  >
                    <FilterPreviewCircle $filter={previewFilterStr} />
                    <span className="name">{preset.name}</span>
                  </FilterCard>
                )
              })}
            </FiltersRow>
          )}

          {/* 3. Crop & Transform Tab */}
          {activeTab === 'crop' && (
            <TransformBar>
              <AspectGroup>
                {(['free', 'original', '1:1', '4:3', '16:9'] as AspectRatioType[]).map(ratio => (
                  <AspectButton
                    key={ratio}
                    $active={aspectRatio === ratio}
                    onClick={() => applyAspectRatio(ratio)}
                  >
                    {ratio === 'free' ? 'Freeform' : ratio === 'original' ? 'Original' : ratio}
                  </AspectButton>
                ))}
              </AspectGroup>

              <ButtonGroup>
                <HeaderButton
                  $variant="ghost"
                  onClick={() => setRotation(r => (r - 90) % 360)}
                  title="Rotate 90° counter-clockwise"
                >
                  ↺ 90°
                </HeaderButton>
                <HeaderButton
                  $variant="ghost"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  title="Rotate 90° clockwise"
                >
                  ↻ 90°
                </HeaderButton>
                <HeaderButton
                  $variant={flipH ? 'active' : 'ghost'}
                  onClick={() => setFlipH(f => !f)}
                  title="Flip horizontal"
                >
                  ⇄ Flip H
                </HeaderButton>
                <HeaderButton
                  $variant={flipV ? 'active' : 'ghost'}
                  onClick={() => setFlipV(f => !f)}
                  title="Flip vertical"
                >
                  ⇅ Flip V
                </HeaderButton>
                <HeaderButton
                  $variant="ghost"
                  onClick={() => {
                    setCrop(DEFAULT_CROP)
                    setAspectRatio('free')
                  }}
                  title="Reset crop frame"
                >
                  Reset Crop
                </HeaderButton>
              </ButtonGroup>
            </TransformBar>
          )}
        </TabContent>
      </BottomPanel>
    </EditorContainer>
  )
}

export default PresentPhotoEditor
