import React, { useRef, useState, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { isNil } from '../../../helpers/utils'
import { getProtectedUrl } from '../ProtectedMedia'
import { MediaGalleryFields } from '../mediaGalleryReducer'
import PresentFilmstrip from './PresentFilmstrip'
import PresentExifBadge from './PresentExifBadge'
import FavoriteIcon from './icons/FavoriteIcon'
import InfoIcon from './icons/InfoIcon'
import FilmstripIcon from './icons/Filmstrip'

const pulseAnimation = keyframes`
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.65);
  }
  30% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  70% {
    opacity: 0.9;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.15);
  }
`

const seekRippleAnimation = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.7);
  }
  40% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(1.2);
  }
`

const VideoContainer = styled.div<{ isCursorHidden: boolean }>`
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  cursor: ${props => (props.isCursorHidden ? 'none' : 'default')};
`

const StyledVideoElement = styled.video`
  width: 100%;
  height: 100%;
  max-width: 100vw;
  max-height: 100vh;
  object-fit: contain;
  outline: none;
`

/* Gradient Scrims */
const TopScrim = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  pointer-events: none;
  z-index: 40;
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 300ms ease;
`

const BottomScrim = styled.div<{ visible: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 100%);
  pointer-events: none;
  z-index: 40;
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 300ms ease;
`

/* Center Pulse Icon */
const CenterPulse = styled.div<{ active: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(18, 18, 20, 0.75);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 50;
  box-shadow: 0 0 35px rgba(0, 0, 0, 0.6);
  animation: ${pulseAnimation} 650ms cubic-bezier(0.2, 0, 0.2, 1) forwards;
  display: ${props => (props.active ? 'flex' : 'none')};
`

const SideSeekIndicator = styled.div<{ side: 'left' | 'right'; active: boolean }>`
  position: absolute;
  top: 50%;
  ${props => (props.side === 'left' ? 'left: 14%;' : 'right: 14%;')}
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: white;
  pointer-events: none;
  z-index: 50;
  animation: ${seekRippleAnimation} 600ms ease-out forwards;
  display: ${props => (props.active ? 'flex' : 'none')};

  .bubble {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(229, 9, 20, 0.3);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(229, 9, 20, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  span {
    font-size: 13px;
    font-weight: 600;
    text-shadow: 0 1px 4px rgba(0,0,0,0.8);
    letter-spacing: 0.5px;
  }
`

/* Controls Overlay */
const ControlsContainer = styled.div<{ visible: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 28px 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 45;
  opacity: ${props => (props.visible ? 1 : 0)};
  transform: ${props => (props.visible ? 'translateY(0)' : 'translateY(12px)')};
  transition: opacity 300ms ease, transform 300ms ease;
  pointer-events: ${props => (props.visible ? 'auto' : 'none')};
`

/* Netflix Red Scrubber */
const ScrubberWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover .scrub-track {
    height: 6px;
  }

  &:hover .scrub-thumb {
    transform: translateY(-50%) scale(1);
    opacity: 1;
  }
`

const ScrubberRail = styled.div`
  position: relative;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 3px;
  transition: height 150ms ease;
`

const BufferProgress = styled.div<{ width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${props => Math.min(100, Math.max(0, props.width))}%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 3px;
  pointer-events: none;
`

const PlayedProgress = styled.div<{ width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${props => Math.min(100, Math.max(0, props.width))}%;
  background: #e50914;
  border-radius: 3px;
  pointer-events: none;
  box-shadow: 0 0 10px rgba(229, 9, 20, 0.5);
`

const ScrubberThumb = styled.div<{ position: number; isScrubbing: boolean }>`
  position: absolute;
  top: 50%;
  left: ${props => Math.min(100, Math.max(0, props.position))}%;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #e50914;
  border: 2px solid #ffffff;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.7), 0 0 12px rgba(229, 9, 20, 0.6);
  transform: translateY(-50%) ${props => (props.isScrubbing ? 'scale(1.2)' : 'scale(0)')};
  opacity: ${props => (props.isScrubbing ? 1 : 0)};
  transition: transform 150ms ease, opacity 150ms ease;
  pointer-events: none;
  margin-left: -7.5px;
`

const HoverTooltip = styled.div<{ left: number; visible: boolean }>`
  position: absolute;
  bottom: 28px;
  left: ${props => props.left}px;
  transform: translateX(-50%);
  background: rgba(18, 18, 20, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  pointer-events: none;
  white-space: nowrap;
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 120ms ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  font-family: monospace, sans-serif;
`

/* Control Bar Buttons & Layout */
const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const ControlsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const ControlButton = styled.button<{ active?: boolean }>`
  background: transparent;
  border: none;
  color: ${props => (props.active ? '#e50914' : 'rgba(255, 255, 255, 0.88)')};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  outline: none;
  transition: color 150ms ease, transform 150ms ease, background 150ms ease;

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.14);
    transform: scale(1.08);
  }

  &:active {
    transform: scale(0.96);
  }

  svg {
    width: 22px;
    height: 22px;
    fill: currentColor;
  }
`

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover .volume-slider-wrapper {
    width: 72px;
    opacity: 1;
    margin-left: 6px;
  }
`

const VolumeSliderWrapper = styled.div`
  width: 0;
  opacity: 0;
  overflow: hidden;
  transition: width 200ms ease, opacity 200ms ease, margin-left 200ms ease;
  display: flex;
  align-items: center;
`

const VolumeSlider = styled.input`
  -webkit-appearance: none;
  width: 72px;
  height: 4px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
    transition: transform 120ms ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    background: #e50914;
  }
`

const TimeDisplay = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: 0.3px;
  margin-left: 6px;
  cursor: pointer;
  user-select: none;
  transition: color 150ms ease;

  &:hover {
    color: #ffffff;
  }

  .separator {
    color: rgba(255, 255, 255, 0.4);
    margin: 0 4px;
  }
`

const SpeedButton = styled.button`
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
  }
`

const SpeedMenu = styled.div`
  position: absolute;
  bottom: 48px;
  right: 120px;
  background: rgba(20, 20, 22, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(14px);
  z-index: 60;
`

const SpeedMenuItem = styled.button<{ selected: boolean }>`
  background: ${props => (props.selected ? 'rgba(229, 9, 20, 0.25)' : 'transparent')};
  border: none;
  color: ${props => (props.selected ? '#e50914' : 'rgba(255, 255, 255, 0.85)')};
  font-weight: ${props => (props.selected ? '700' : '500')};
  font-size: 12px;
  padding: 6px 14px;
  text-align: left;
  border-radius: 4px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
  }
`

/* Formatting Helper */
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}

export interface PresentVideoPlayerProps {
  media: MediaGalleryFields
  isFavorite?: boolean
  onToggleFavorite?: () => void
  showExif?: boolean
  onToggleExif?: () => void
  showFilmstrip?: boolean
  onToggleFilmstrip?: () => void
  mediaList?: MediaGalleryFields[]
  onSelectMedia?: (media: MediaGalleryFields, index: number) => void
  hideControls?: boolean
}

export const PresentVideoPlayer = ({
  media,
  isFavorite,
  onToggleFavorite,
  showExif,
  onToggleExif,
  showFilmstrip,
  onToggleFilmstrip,
  mediaList,
  onSelectMedia,
  hideControls = false,
}: PresentVideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scrubberRef = useRef<HTMLDivElement | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showRemainingTime, setShowRemainingTime] = useState(false)

  const [controlsVisible, setControlsVisible] = useState(true)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [hoverTime, setHoverTime] = useState(0)
  const [hoverLeft, setHoverLeft] = useState(0)
  const [showHoverTooltip, setShowHoverTooltip] = useState(false)

  // Center pulse animation state
  const [pulseState, setPulseState] = useState<{ active: boolean; isPlay: boolean }>({
    active: false,
    isPlay: false,
  })

  // Side seek indicator
  const [sideSeekState, setSideSeekState] = useState<{ active: boolean; side: 'left' | 'right' }>({
    active: false,
    side: 'right',
  })

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sideSeekTimerRef = useRef<NodeJS.Timeout | null>(null)

  const triggerPulse = useCallback((isPlay: boolean) => {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    setPulseState({ active: true, isPlay })
    pulseTimerRef.current = setTimeout(() => {
      setPulseState(prev => ({ ...prev, active: false }))
    }, 650)
  }, [])

  const triggerSideSeek = useCallback((side: 'left' | 'right') => {
    if (sideSeekTimerRef.current) clearTimeout(sideSeekTimerRef.current)
    setSideSeekState({ active: true, side })
    sideSeekTimerRef.current = setTimeout(() => {
      setSideSeekState(prev => ({ ...prev, active: false }))
    }, 600)
  }, [])

  const resetAutohideTimer = useCallback(() => {
    setControlsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)

    if (isPlaying && !isScrubbing) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false)
        setShowSpeedMenu(false)
      }, 2500)
    }
  }, [isPlaying, isScrubbing])

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().then(() => {
        setIsPlaying(true)
        triggerPulse(true)
      }).catch(err => console.error('Video play error:', err))
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
      triggerPulse(false)
    }
    resetAutohideTimer()
  }, [triggerPulse, resetAutohideTimer])

  // Quick skip 10 seconds
  const skipTime = useCallback((delta: number) => {
    if (!videoRef.current) return
    const newTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + delta))
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
    triggerSideSeek(delta > 0 ? 'right' : 'left')
    resetAutohideTimer()
  }, [triggerSideSeek, resetAutohideTimer])

  // Volume & Mute
  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return
    const vol = Math.max(0, Math.min(1, newVol))
    videoRef.current.volume = vol
    setVolume(vol)
    if (vol > 0 && isMuted) {
      videoRef.current.muted = false
      setIsMuted(false)
    }
    resetAutohideTimer()
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    if (isMuted) {
      videoRef.current.muted = false
      setIsMuted(false)
      if (volume === 0) {
        videoRef.current.volume = 0.5
        setVolume(0.5)
      }
    } else {
      videoRef.current.muted = true
      setIsMuted(true)
    }
    resetAutohideTimer()
  }

  // Playback speed
  const changeSpeed = (rate: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = rate
    setPlaybackRate(rate)
    setShowSpeedMenu(false)
    resetAutohideTimer()
  }

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err))
    } else {
      document.exitFullscreen().catch(err => console.error(err))
    }
    resetAutohideTimer()
  }

  // Scrubber events
  const calculateScrubPosition = (e: React.MouseEvent | MouseEvent) => {
    if (!scrubberRef.current || duration <= 0) return 0
    const rect = scrubberRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    return Math.max(0, Math.min(1, pos)) * duration
  }

  const handleScrubberMouseMove = (e: React.MouseEvent) => {
    if (!scrubberRef.current) return
    const rect = scrubberRef.current.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHoverLeft(e.clientX - rect.left)
    setHoverTime(pos * duration)
    setShowHoverTooltip(true)
  }

  const handleScrubberMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true)
    const targetTime = calculateScrubPosition(e)
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime
      setCurrentTime(targetTime)
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      const scrubTime = calculateScrubPosition(moveEvent)
      if (videoRef.current) {
        videoRef.current.currentTime = scrubTime
        setCurrentTime(scrubTime)
      }
    }

    const onMouseUp = () => {
      setIsScrubbing(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Double click seek on video area
  const handleVideoClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width

    if (e.detail === 2) {
      // Double-click
      if (clickX < width * 0.33) {
        skipTime(-10)
      } else if (clickX > width * 0.66) {
        skipTime(10)
      } else {
        toggleFullscreen()
      }
    } else if (e.detail === 1) {
      togglePlay()
    }
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when focusing inputs
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return
      }

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skipTime(-5)
          break
        case 'ArrowRight':
          e.preventDefault()
          skipTime(5)
          break
        case 'j':
        case 'J':
          e.preventDefault()
          skipTime(-10)
          break
        case 'l':
        case 'L':
          e.preventDefault()
          skipTime(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(volume + 0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(volume - 0.1)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        default:
          if (e.key >= '0' && e.key <= '9' && videoRef.current && duration > 0) {
            e.preventDefault()
            const target = (parseInt(e.key) / 10) * duration
            videoRef.current.currentTime = target
            setCurrentTime(target)
            resetAutohideTimer()
          }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, skipTime, volume, duration, resetAutohideTimer])

  // Video element events
  const onTimeUpdate = () => {
    if (!videoRef.current || isScrubbing) return
    setCurrentTime(videoRef.current.currentTime)

    if (videoRef.current.buffered.length > 0) {
      setBufferedEnd(videoRef.current.buffered.end(videoRef.current.buffered.length - 1))
    }
  }

  const onLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
  }

  // Autohide management on activity
  useEffect(() => {
    resetAutohideTimer()
  }, [isPlaying, isScrubbing, resetAutohideTimer])

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0

  if (isNil(media.videoWeb)) {
    return (
      <VideoContainer isCursorHidden={false}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
          Video not available for this media.
        </div>
      </VideoContainer>
    )
  }

  const videoUrl = getProtectedUrl(media.videoWeb.url)
  const posterUrl = getProtectedUrl(media.thumbnail?.url)

  const isControlsVisible = !hideControls && (controlsVisible || !isPlaying || isScrubbing)

  return (
    <VideoContainer
      ref={containerRef}
      isCursorHidden={!isControlsVisible && isPlaying}
      onMouseMove={resetAutohideTimer}
      onClick={handleVideoClick}
      data-testid="netflix-video-player"
    >
      <StyledVideoElement
        data-testid="present-video"
        ref={videoRef}
        key={media.id}
        crossOrigin="use-credentials"
        poster={posterUrl}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        playsInline
      >
        <source src={videoUrl} type="video/mp4" />
      </StyledVideoElement>

      {/* Center Pulse Indicator */}
      <CenterPulse active={pulseState.active}>
        {pulseState.isPlay ? (
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 44, height: 44, marginLeft: 4 }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 44, height: 44 }}>
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        )}
      </CenterPulse>

      {/* Side Quick Seek Indicators */}
      <SideSeekIndicator side="left" active={sideSeekState.active && sideSeekState.side === 'left'}>
        <div className="bubble">
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 28, height: 28 }}>
            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C20.95 11.23 17.13 8 12.5 8z" />
          </svg>
        </div>
        <span>-10s</span>
      </SideSeekIndicator>

      <SideSeekIndicator side="right" active={sideSeekState.active && sideSeekState.side === 'right'}>
        <div className="bubble">
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 28, height: 28 }}>
            <path d="M11.5 8c2.65 0 5.05.99 6.9 2.6L22 7v9h-9l3.62-3.62c-1.39-1.16-3.16-1.88-5.12-1.88-3.54 0-6.55 2.31-7.6 5.5l-2.37-.78C3.05 11.23 6.87 8 11.5 8z" />
          </svg>
        </div>
        <span>+10s</span>
      </SideSeekIndicator>

      {/* Scrims */}
      <TopScrim visible={isControlsVisible} />
      <BottomScrim visible={isControlsVisible} />

      {/* Netflix Controls Overlay */}
      <ControlsContainer
        visible={isControlsVisible}
        onClick={e => e.stopPropagation()}
      >
        {/* Scrubber Bar */}
        <ScrubberWrapper
          ref={scrubberRef}
          onMouseDown={handleScrubberMouseDown}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={() => setShowHoverTooltip(false)}
        >
          <HoverTooltip left={hoverLeft} visible={showHoverTooltip}>
            {formatTime(hoverTime)}
          </HoverTooltip>
          <ScrubberRail className="scrub-track">
            <BufferProgress width={bufferPercent} />
            <PlayedProgress width={playedPercent} />
            <ScrubberThumb
              className="scrub-thumb"
              position={playedPercent}
              isScrubbing={isScrubbing}
            />
          </ScrubberRail>
        </ScrubberWrapper>

        {/* Controls Row */}
        <ControlsRow>
          <ControlsGroup>
            {/* Play / Pause */}
            <ControlButton
              title={isPlaying ? 'Pause (Space / k)' : 'Play (Space / k)'}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </ControlButton>

            {/* Skip -10s */}
            <ControlButton
              title="Rewind 10 seconds (j / ⟲)"
              onClick={() => skipTime(-10)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C20.95 11.23 17.13 8 12.5 8z" />
              </svg>
            </ControlButton>

            {/* Skip +10s */}
            <ControlButton
              title="Forward 10 seconds (l / ⟳)"
              onClick={() => skipTime(10)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M11.5 8c2.65 0 5.05.99 6.9 2.6L22 7v9h-9l3.62-3.62c-1.39-1.16-3.16-1.88-5.12-1.88-3.54 0-6.55 2.31-7.6 5.5l-2.37-.78C3.05 11.23 6.87 8 11.5 8z" />
              </svg>
            </ControlButton>

            {/* Volume Control */}
            <VolumeContainer>
              <ControlButton
                title={isMuted || volume === 0 ? 'Unmute (m)' : 'Mute (m)'}
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : volume > 0.5 ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  </svg>
                )}
              </ControlButton>
              <VolumeSliderWrapper className="volume-slider-wrapper">
                <VolumeSlider
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                />
              </VolumeSliderWrapper>
            </VolumeContainer>

            {/* Time Display */}
            <TimeDisplay
              onClick={() => setShowRemainingTime(!showRemainingTime)}
              title="Click to toggle remaining time"
            >
              {formatTime(currentTime)}
              <span className="separator">/</span>
              {showRemainingTime ? `-${formatTime(duration - currentTime)}` : formatTime(duration)}
            </TimeDisplay>
          </ControlsGroup>

          <ControlsGroup>
            {/* Playback Speed */}
            <div style={{ position: 'relative' }}>
              <SpeedButton
                title="Playback speed"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              >
                {playbackRate}x
              </SpeedButton>
              {showSpeedMenu && (
                <SpeedMenu>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <SpeedMenuItem
                      key={rate}
                      selected={playbackRate === rate}
                      onClick={() => changeSpeed(rate)}
                    >
                      {rate === 1 ? '1x (Normal)' : `${rate}x`}
                    </SpeedMenuItem>
                  ))}
                </SpeedMenu>
              )}
            </div>

            {/* Favorite Button */}
            {onToggleFavorite && (
              <ControlButton
                active={isFavorite}
                title={isFavorite ? 'Remove from favorites (s)' : 'Add to favorites (s)'}
                onClick={onToggleFavorite}
                style={isFavorite ? { color: '#f43f5e' } : undefined}
              >
                <FavoriteIcon filled={isFavorite} />
              </ControlButton>
            )}

            {/* EXIF Info HUD Toggle */}
            {onToggleExif && (
              <ControlButton
                active={showExif}
                title="Toggle metadata HUD (i)"
                onClick={onToggleExif}
              >
                <InfoIcon />
              </ControlButton>
            )}

            {/* Filmstrip Toggle */}
            {mediaList && onToggleFilmstrip && (
              <ControlButton
                active={showFilmstrip}
                title="Toggle thumbnail filmstrip (f)"
                onClick={onToggleFilmstrip}
              >
                <FilmstripIcon />
              </ControlButton>
            )}

            {/* Fullscreen Toggle */}
            <ControlButton
              title="Fullscreen (f)"
              onClick={toggleFullscreen}
            >
              <svg viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            </ControlButton>
          </ControlsGroup>
        </ControlsRow>
      </ControlsContainer>

      {/* EXIF Metadata HUD Badge */}
      {showExif && (
        <PresentExifBadge
          media={media}
          visible={showExif}
          hideControls={hideControls}
        />
      )}

      {/* Bottom Filmstrip */}
      {mediaList && onSelectMedia && (
        <PresentFilmstrip
          mediaList={mediaList}
          activeMedia={media}
          visible={Boolean(showFilmstrip)}
          hideControls={hideControls}
          onSelectMedia={onSelectMedia}
        />
      )}
    </VideoContainer>
  )
}

export default PresentVideoPlayer
