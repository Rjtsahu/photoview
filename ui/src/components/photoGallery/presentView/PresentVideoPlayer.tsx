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
    transform: scale(1.15);
  }
`

const spinAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`

const VideoContainer = styled.div<{ isCursorHidden: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
  overflow: hidden;
  user-select: none;
  cursor: ${props => (props.isCursorHidden ? 'none' : 'default')};
  z-index: 10;
`

const StyledVideoElement = styled.video`
  max-width: 100vw;
  max-height: 100vh;
  width: auto;
  height: auto;
  outline: none;
  object-fit: contain;
  background-color: #000;
`

// Center Pulse (Play / Pause / Speed toast)
const CenterPulse = styled.div<{ active: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(15, 15, 18, 0.78);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 40;
  box-shadow: 0 0 35px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  opacity: ${props => (props.active ? 1 : 0)};
  animation: ${props => (props.active ? pulseAnimation : 'none')} 550ms ease-out forwards;
`

const SpeedToastText = styled.span`
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
`

// Double Click Seek Indicators
const SeekIndicator = styled.div<{ side: 'left' | 'right'; active: boolean }>`
  position: absolute;
  top: 0;
  ${props => (props.side === 'left' ? 'left: 0;' : 'right: 0;')}
  width: 38%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 35;
  opacity: ${props => (props.active ? 1 : 0)};
`

const SeekCircle = styled.div<{ side: 'left' | 'right'; active: boolean }>`
  background: rgba(20, 20, 24, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 90px;
  height: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.6);
  animation: ${props => (props.active ? seekRippleAnimation : 'none')} 600ms ease-out forwards;

  span {
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
`

// Buffering Center Overlay with Percentage & Buffer Stats
const BufferingOverlay = styled.div<{ active: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(12, 12, 16, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 22px 30px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(14px);
  pointer-events: none;
  z-index: 45;
  opacity: ${props => (props.active ? 1 : 0)};
  transition: opacity 250ms ease;
`

const SpinnerSvg = styled.svg`
  width: 52px;
  height: 52px;
  animation: ${spinAnimation} 1s linear infinite;
  margin-bottom: 12px;
`

const BufferingPercentText = styled.div`
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`

const BufferingDetailsText = styled.div`
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  font-weight: 500;
`

const BufferingTotalText = styled.div`
  color: #e50914;
  font-size: 11px;
  font-weight: 600;
  margin-top: 4px;
`

// Gradient Overlays (Netflix Scrims)
const TopScrim = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%);
  pointer-events: ${props => (props.visible ? 'auto' : 'none')};
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 250ms ease;
  z-index: 65;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 32px;
`

const MediaTitle = styled.h2`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  margin: 0;
  max-width: 70%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const BottomScrim = styled.div<{ visible: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  min-height: 120px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.65) 60%, transparent 100%);
  pointer-events: ${props => (props.visible ? 'auto' : 'none')};
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 250ms ease, transform 250ms ease;
  transform: translateY(${props => (props.visible ? '0px' : '8px')});
  z-index: 65;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 32px 28px;
`

const FilmstripWrapper = styled.div<{ visible: boolean }>`
  position: absolute;
  bottom: 96px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  pointer-events: ${props => (props.visible ? 'auto' : 'none')};
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 250ms ease;
  z-index: 60;

  & > div {
    position: relative !important;
    bottom: auto !important;
    left: auto !important;
    transform: none !important;
  }
`

// Scrubber Bar
const ScrubberWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 8px;

  &:hover .scrub-rail {
    height: 7px;
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
  overflow: visible;
`

const BufferProgress = styled.div<{ width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: ${props => Math.min(100, Math.max(0, props.width))}%;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 3px;
  pointer-events: none;
`

const PlayedProgress = styled.div<{ width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
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
  bottom: 30px;
  left: ${props => props.left}px;
  transform: translateX(-50%);
  background: rgba(20, 20, 24, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 5px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 120ms ease;
  z-index: 50;
`

// Controls Bar & Groups
const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const ControlsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const IconButton = styled.button<{ active?: boolean }>`
  background: none;
  border: none;
  color: ${props => (props.active ? '#e50914' : 'rgba(255, 255, 255, 0.85)')};
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  transition: transform 150ms ease, color 150ms ease, background-color 150ms ease;

  svg {
    width: 22px;
    height: 22px;
    fill: currentColor;
  }

  &:hover {
    color: #ffffff;
    transform: scale(1.12);
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: scale(0.95);
  }
`

const PlayPauseButton = styled(IconButton)`
  svg {
    width: 30px;
    height: 30px;
  }
`

const SkipButton = styled(IconButton)`
  position: relative;
  svg {
    width: 24px;
    height: 24px;
  }
  span {
    position: absolute;
    font-size: 8px;
    font-weight: 800;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
`

// Volume Slider Container
const VolumeWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover .volume-slider-bar {
    width: 72px;
    opacity: 1;
    margin-left: 2px;
  }
`

const VolumeSliderBar = styled.input`
  width: 0;
  opacity: 0;
  transition: width 200ms ease, opacity 200ms ease, margin 200ms ease;
  accent-color: #e50914;
  cursor: pointer;
  height: 4px;
`

// Time Display
const TimeText = styled.div`
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  user-select: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    color: #ffffff;
  }
`

const BufferReadoutBadge = styled.span`
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.2px;

  &:hover {
    background: rgba(229, 9, 20, 0.3);
    color: #fff;
  }
`

// Playback Speed Button & Menu
const SpeedControlWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

const SpeedButton = styled.button`
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 5px;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 150ms ease, border-color 150ms ease, transform 120ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.45);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`

const SpeedCaret = styled.span`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  transition: transform 150ms ease;
`

const SpeedMenu = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  min-width: 105px;
  background: rgba(18, 18, 22, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(16px);
  z-index: 100;
`

const SpeedMenuItem = styled.button<{ selected: boolean }>`
  background: ${props => (props.selected ? 'rgba(229, 9, 20, 0.3)' : 'transparent')};
  border: none;
  color: ${props => (props.selected ? '#e50914' : 'rgba(255, 255, 255, 0.85)')};
  font-weight: ${props => (props.selected ? '700' : '500')};
  font-size: 12px;
  padding: 7px 10px;
  border-radius: 5px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  outline: none;
  transition: background-color 120ms ease, color 120ms ease;

  &:hover {
    background: ${props => (props.selected ? 'rgba(229, 9, 20, 0.4)' : 'rgba(255, 255, 255, 0.12)')};
    color: #ffffff;
  }
`

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const TARGET_BUFFER_CUSHION_SEC = 5 // Target 5 seconds ahead before resuming from stall

export interface PresentVideoPlayerProps {
  media: MediaGalleryFields
  isFavorite?: boolean
  onToggleFavorite?: () => void
  showExif?: boolean
  onToggleExif?: () => void
  showFilmstrip?: boolean
  onToggleFilmstrip?: () => void
  mediaList?: MediaGalleryFields[]
  onSelectMedia?: (media: MediaGalleryFields) => void
  hideControls?: boolean
}

const PresentVideoPlayer: React.FC<PresentVideoPlayerProps> = ({
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
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scrubberRailRef = useRef<HTMLDivElement | null>(null)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const speedMenuRef = useRef<HTMLDivElement | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [totalBufferedDuration, setTotalBufferedDuration] = useState(0)
  const [bufferAheadSec, setBufferAheadSec] = useState(0)
  const [bufferCushionPercent, setBufferCushionPercent] = useState(100)
  const [isBuffering, setIsBuffering] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showRemainingTime, setShowRemainingTime] = useState(false)
  const [isHoveringControls, setIsHoveringControls] = useState(false)

  const [controlsVisible, setControlsVisible] = useState(true)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [hoverTime, setHoverTime] = useState(0)
  const [hoverLeft, setHoverLeft] = useState(0)
  const [showHoverTooltip, setShowHoverTooltip] = useState(false)

  // Center pulse animation state (play / pause / speed)
  const [pulseState, setPulseState] = useState<{
    active: boolean
    type: 'play' | 'pause' | 'speed'
    text?: string
  }>({ active: false, type: 'play' })

  // Double-click seek indicator state
  const [seekState, setSeekState] = useState<{ active: boolean; side: 'left' | 'right' }>({
    active: false,
    side: 'left',
  })

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Close speed menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false)
      }
    }
    if (showSpeedMenu) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [showSpeedMenu])

  // Helper: compute buffer ahead from video element TimeRanges
  const updateBufferMetrics = useCallback(() => {
    if (!videoRef.current) return
    const video = videoRef.current
    const ct = video.currentTime
    let ahead = 0
    let rangeEnd = 0
    let totalBuffered = 0

    for (let i = 0; i < video.buffered.length; i++) {
      const start = video.buffered.start(i)
      const end = video.buffered.end(i)
      totalBuffered += (end - start)
      if (ct >= start && ct <= end) {
        ahead = Math.max(0, end - ct)
        rangeEnd = end
      }
    }

    if (ahead === 0 && video.buffered.length > 0) {
      for (let i = 0; i < video.buffered.length; i++) {
        const start = video.buffered.start(i)
        const end = video.buffered.end(i)
        if (ct < start && start - ct < 0.5) {
          ahead = end - ct
          rangeEnd = end
          break
        }
      }
    }

    setBufferAheadSec(ahead)
    setBufferedEnd(rangeEnd || (video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0))
    setTotalBufferedDuration(totalBuffered)

    const target = Math.min(TARGET_BUFFER_CUSHION_SEC, (video.duration || 10) - ct)
    const cushionPct = target > 0 ? Math.min(100, Math.round((ahead / target) * 100)) : 100
    setBufferCushionPercent(cushionPct)

    return { ahead, target, cushionPct }
  }, [])

  // Auto-hide controls after 4.5s of inactivity while playing and not hovering controls
  const resetAutohideTimer = useCallback((mouseY?: number) => {
    setControlsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)

    const isNearBottom = typeof mouseY === 'number' && typeof window !== 'undefined' && mouseY > (window.innerHeight - 200)

    if (isPlaying && !isScrubbing && !isBuffering && !isHoveringControls && !isNearBottom) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false)
        setShowSpeedMenu(false)
      }, 4500)
    }
  }, [isPlaying, isScrubbing, isBuffering, isHoveringControls])

  // Global window mousemove and touch listeners to guarantee controls show up on any interaction
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      resetAutohideTimer(e.clientY)
    }

    const handleGlobalTouch = () => {
      resetAutohideTimer()
    }

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true })
    window.addEventListener('touchstart', handleGlobalTouch, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('touchstart', handleGlobalTouch)
    }
  }, [resetAutohideTimer])

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().then(() => {
        setIsPlaying(true)
        setPulseState({ active: true, type: 'play' })
      }).catch(err => {
        console.warn("Video play interrupted:", err)
      })
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
      setPulseState({ active: true, type: 'pause' })
    }
    resetAutohideTimer()
  }, [resetAutohideTimer])

  // Skip delta in seconds
  const skipTime = useCallback((delta: number) => {
    if (!videoRef.current) return
    const newTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + delta))
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
    resetAutohideTimer()
  }, [resetAutohideTimer])

  // Volume & Mute
  const handleVolumeChange = (vol: number) => {
    if (!videoRef.current) return
    setVolume(vol)
    videoRef.current.volume = vol
    if (vol > 0 && isMuted) {
      setIsMuted(false)
      videoRef.current.muted = false
    }
    resetAutohideTimer()
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    if (isMuted) {
      videoRef.current.muted = false
      setIsMuted(false)
      if (volume === 0) {
        setVolume(0.5)
        videoRef.current.volume = 0.5
      }
    } else {
      videoRef.current.muted = true
      setIsMuted(true)
    }
    resetAutohideTimer()
  }

  // Playback speed setter
  const changeSpeed = (rate: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = rate
    setPlaybackRate(rate)
    setShowSpeedMenu(false)
    setPulseState({ active: true, type: 'speed', text: `${rate}x` })
    resetAutohideTimer()
  }

  // Cycle speed on direct button click
  const cycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length
    const nextRate = SPEED_OPTIONS[nextIndex]
    changeSpeed(nextRate)
  }

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err)
      })
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Exit fullscreen failed:', err)
      })
    }
    resetAutohideTimer()
  }

  // Time format helper (MM:SS or HH:MM:SS)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`
    }
    return `${pad(m)}:${pad(s)}`
  }

  // Scrubber scrubbing handlers
  const calculateScrubTime = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!scrubberRailRef.current || duration <= 0) return 0
    const rect = scrubberRailRef.current.getBoundingClientRect()
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const ratio = clickX / rect.width
    return ratio * duration
  }

  const handleScrubberMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setIsScrubbing(true)
    const targetTime = calculateScrubTime(e)
    setCurrentTime(targetTime)
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      const scrubTime = calculateScrubTime(moveEvent)
      setCurrentTime(scrubTime)
      if (videoRef.current) {
        videoRef.current.currentTime = scrubTime
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

  // Hover tooltip on scrubber rail
  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRailRef.current || duration <= 0) return
    const rect = scrubberRailRef.current.getBoundingClientRect()
    const hoverX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const ratio = hoverX / rect.width
    setHoverTime(ratio * duration)
    setHoverLeft(hoverX)
    setShowHoverTooltip(true)
  }

  // Double click seek on video area
  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showSpeedMenu) {
      setShowSpeedMenu(false)
    }

    // If controls were hidden, clicking shows them immediately
    if (!isControlsVisible) {
      setControlsVisible(true)
      resetAutohideTimer()
      return
    }

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null

      // Double click registered!
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const width = rect.width

      if (clickX < width * 0.35) {
        skipTime(-10)
        setSeekState({ active: true, side: 'left' })
        setTimeout(() => setSeekState(s => ({ ...s, active: false })), 600)
      } else if (clickX > width * 0.65) {
        skipTime(10)
        setSeekState({ active: true, side: 'right' })
        setTimeout(() => setSeekState(s => ({ ...s, active: false })), 600)
      } else {
        togglePlay()
      }
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null
        togglePlay()
      }, 250)
    }
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
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
          handleVolumeChange(Math.min(1, volume + 0.05))
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(Math.max(0, volume - 0.05))
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
            const target = (parseInt(e.key, 10) / 10) * duration
            videoRef.current.currentTime = target
            setCurrentTime(target)
            resetAutohideTimer()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, skipTime, volume, duration, resetAutohideTimer])

  // Video element events & Buffer Starvation Handlers
  const onTimeUpdate = () => {
    if (!videoRef.current || isScrubbing) return
    setCurrentTime(videoRef.current.currentTime)
    const metrics = updateBufferMetrics()

    // If we are playing and buffer ahead is healthy, clear any buffering state
    if (metrics && metrics.ahead >= Math.min(2.5, metrics.target) && isBuffering) {
      setIsBuffering(false)
    }
  }

  const onLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
    updateBufferMetrics()
  }

  const onProgress = () => {
    const metrics = updateBufferMetrics()
    if (!videoRef.current) return

    // If in buffering state, check if we reached target buffer cushion
    if (isBuffering && metrics) {
      if (metrics.ahead >= metrics.target || videoRef.current.readyState >= 4) {
        setIsBuffering(false)
        if (isPlaying) {
          videoRef.current.play().catch(console.warn)
        }
      }
    }
  }

  const onWaiting = () => {
    // Video stalled because it ran out of buffer data
    setIsBuffering(true)
    updateBufferMetrics()
  }

  const onPlaying = () => {
    setIsPlaying(true)
    setIsBuffering(false)
    updateBufferMetrics()
  }

  const onCanPlayThrough = () => {
    // Browser estimates video can play without stopping for buffering
    setIsBuffering(false)
    updateBufferMetrics()
  }

  // Autohide management on activity
  useEffect(() => {
    resetAutohideTimer()
  }, [isPlaying, isScrubbing, isBuffering, resetAutohideTimer])

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferBarPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0
  const totalDownloadedPercent = duration > 0 ? Math.min(100, Math.round((totalBufferedDuration / duration) * 100)) : 0

  if (isNil(media.videoWeb)) {
    console.error('PresentVideoPlayer called with media.videoWeb = null')
    return null
  }

  const videoUrl = getProtectedUrl(media.videoWeb.url)
  const posterUrl = getProtectedUrl(media.thumbnail?.url)

  const isControlsVisible = controlsVisible || !isPlaying || isScrubbing || isBuffering || isHoveringControls

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
        preload="auto"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onProgress={onProgress}
        onWaiting={onWaiting}
        onStalled={onWaiting}
        onPlaying={onPlaying}
        onCanPlayThrough={onCanPlayThrough}
        onEnded={() => {
          setIsPlaying(false)
          setIsBuffering(false)
        }}
        playsInline
      >
        <source src={videoUrl} type="video/mp4" />
      </StyledVideoElement>

      {/* Center Pulse Indicator */}
      <CenterPulse active={pulseState.active}>
        {pulseState.type === 'play' && (
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 44, height: 44, marginLeft: 4 }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        {pulseState.type === 'pause' && (
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 44, height: 44 }}>
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        )}
        {pulseState.type === 'speed' && (
          <SpeedToastText>{pulseState.text}</SpeedToastText>
        )}
      </CenterPulse>

      {/* Double Tap Seek Indicators */}
      <SeekIndicator side="left" active={seekState.active && seekState.side === 'left'}>
        <SeekCircle side="left" active={seekState.active && seekState.side === 'left'}>
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 28, height: 28 }}>
            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
          </svg>
          <span>-10s</span>
        </SeekCircle>
      </SeekIndicator>

      <SeekIndicator side="right" active={seekState.active && seekState.side === 'right'}>
        <SeekCircle side="right" active={seekState.active && seekState.side === 'right'}>
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 28, height: 28 }}>
            <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
          </svg>
          <span>+10s</span>
        </SeekCircle>
      </SeekIndicator>

      {/* Center Buffering HUD with Percentage */}
      <BufferingOverlay active={isBuffering}>
        <SpinnerSvg viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="4"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="#e50914"
            strokeWidth="4"
            strokeDasharray="80, 200"
            strokeLinecap="round"
          />
        </SpinnerSvg>
        <BufferingPercentText>
          Buffering {bufferCushionPercent}%
        </BufferingPercentText>
        <BufferingDetailsText>
          {bufferAheadSec.toFixed(1)}s / {Math.min(TARGET_BUFFER_CUSHION_SEC, Math.max(1, duration - currentTime)).toFixed(1)}s cushion
        </BufferingDetailsText>
        {totalDownloadedPercent > 0 && (
          <BufferingTotalText>
            {totalDownloadedPercent}% downloaded
          </BufferingTotalText>
        )}
      </BufferingOverlay>

      {/* Top Scrim with Media Title */}
      <TopScrim
        data-testid="video-top-controls"
        visible={isControlsVisible}
        onClick={e => e.stopPropagation()}
        onMouseEnter={() => {
          setIsHoveringControls(true)
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
          setControlsVisible(true)
        }}
        onMouseLeave={() => {
          setIsHoveringControls(false)
          resetAutohideTimer()
        }}
      >
        <MediaTitle>{media.title || 'Video'}</MediaTitle>
        {showExif && onToggleExif && (
          <PresentExifBadge media={media} onClose={onToggleExif} />
        )}
      </TopScrim>

      {/* Bottom Scrim with Scrubber & Controls */}
      <BottomScrim
        data-testid="video-bottom-controls"
        visible={isControlsVisible}
        onClick={e => e.stopPropagation()}
        onMouseEnter={() => {
          setIsHoveringControls(true)
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
          setControlsVisible(true)
        }}
        onMouseLeave={() => {
          setIsHoveringControls(false)
          resetAutohideTimer()
        }}
      >
        {/* Scrubber Progress Bar */}
        <ScrubberWrapper
          data-testid="video-scrubber"
          onMouseDown={handleScrubberMouseDown}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={() => setShowHoverTooltip(false)}
        >
          <HoverTooltip left={hoverLeft} visible={showHoverTooltip}>
            {formatTime(hoverTime)}
          </HoverTooltip>

          <ScrubberRail ref={scrubberRailRef} className="scrub-rail">
            <BufferProgress width={bufferBarPercent} />
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
          {/* Left Controls: Play, Quick Skip, Volume, Time */}
          <ControlsGroup>
            <PlayPauseButton
              data-testid="video-play-pause-button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
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
            </PlayPauseButton>

            {/* Skip Backward 10s */}
            <SkipButton onClick={() => skipTime(-10)} title="Rewind 10s (J / Left Arrow)">
              <svg viewBox="0 0 24 24">
                <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.2 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
              </svg>
              <span>10</span>
            </SkipButton>

            {/* Skip Forward 10s */}
            <SkipButton onClick={() => skipTime(10)} title="Forward 10s (L / Right Arrow)">
              <svg viewBox="0 0 24 24">
                <path d="M11.5 8c2.65 0 5.05.99 6.9 2.6L22 7v9h-9l3.62-3.62c-1.39-1.2-3.16-1.88-5.12-1.88-3.54 0-6.55 2.31-7.6 5.5l-2.37-.78C2.92 11.03 6.85 8 11.5 8z" />
              </svg>
              <span>10</span>
            </SkipButton>

            {/* Volume Control */}
            <VolumeWrapper>
              <IconButton onClick={toggleMute} title={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
                {isMuted || volume === 0 ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </IconButton>
              <VolumeSliderBar
                className="volume-slider-bar"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
              />
            </VolumeWrapper>

            {/* Time Readout */}
            <TimeText onClick={() => setShowRemainingTime(!showRemainingTime)}>
              {showRemainingTime
                ? `-${formatTime(Math.max(0, duration - currentTime))}`
                : `${formatTime(currentTime)} / ${formatTime(duration)}`}
              {totalDownloadedPercent > 0 && (
                <BufferReadoutBadge title="Pre-buffered in browser memory">
                  {totalDownloadedPercent}% buffered
                </BufferReadoutBadge>
              )}
            </TimeText>
          </ControlsGroup>

          {/* Right Controls: Speed, Favorite, Info, Filmstrip, Fullscreen */}
          <ControlsGroup>
            {/* Playback Speed (Click to cycle, click caret for menu) */}
            <SpeedControlWrapper ref={speedMenuRef}>
              <SpeedButton
                data-testid="video-speed-button"
                title="Click to cycle speed (0.5x, 1x, 1.25x, 1.5x, 2x) or choose from menu"
                onClick={e => {
                  e.stopPropagation()
                  cycleSpeed()
                }}
              >
                <span>{playbackRate === 1 ? '1x' : `${playbackRate}x`}</span>
                <SpeedCaret
                  onClick={e => {
                    e.stopPropagation()
                    setShowSpeedMenu(!showSpeedMenu)
                  }}
                  title="Choose speed"
                >
                  ▾
                </SpeedCaret>
              </SpeedButton>

              {showSpeedMenu && (
                <SpeedMenu onClick={e => e.stopPropagation()}>
                  {SPEED_OPTIONS.map(rate => (
                    <SpeedMenuItem
                      key={rate}
                      selected={playbackRate === rate}
                      onClick={() => changeSpeed(rate)}
                    >
                      <span>{rate === 1 ? '1x (Normal)' : `${rate}x`}</span>
                      {playbackRate === rate && <span>✓</span>}
                    </SpeedMenuItem>
                  ))}
                </SpeedMenu>
              )}
            </SpeedControlWrapper>

            {/* Favorite Button */}
            {onToggleFavorite && (
              <IconButton
                active={isFavorite}
                onClick={onToggleFavorite}
                title={isFavorite ? 'Remove from favorites (S)' : 'Add to favorites (S)'}
              >
                <FavoriteIcon active={isFavorite} />
              </IconButton>
            )}

            {/* EXIF / Info Button */}
            {onToggleExif && (
              <IconButton
                active={showExif}
                onClick={onToggleExif}
                title="Photo & Video Details (I)"
              >
                <InfoIcon />
              </IconButton>
            )}

            {/* Filmstrip Toggle */}
            {mediaList && onToggleFilmstrip && (
              <IconButton
                active={showFilmstrip}
                title="Toggle filmstrip (F)"
                onClick={onToggleFilmstrip}
              >
                <FilmstripIcon />
              </IconButton>
            )}

            {/* Fullscreen Button */}
            <IconButton onClick={toggleFullscreen} title="Fullscreen (F)">
              {document.fullscreenElement ? (
                <svg viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </IconButton>
          </ControlsGroup>
        </ControlsRow>
      </BottomScrim>

      {/* Bottom Filmstrip */}
      {mediaList && onSelectMedia && (
        <FilmstripWrapper visible={Boolean(showFilmstrip)}>
          <PresentFilmstrip
            mediaList={mediaList}
            activeMedia={media}
            visible={Boolean(showFilmstrip)}
            onSelectMedia={onSelectMedia}
          />
        </FilmstripWrapper>
      )}
    </VideoContainer>
  )
}

export default PresentVideoPlayer
