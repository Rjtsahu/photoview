import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { MediaType } from '../../../__generated__/globalTypes'
import { MediaGalleryFields } from '../__generated__/MediaGalleryFields'
import PresentVideoPlayer from './PresentVideoPlayer'

const sampleVideoMedia: MediaGalleryFields = {
  __typename: 'Media',
  id: 'video-123',
  type: MediaType.Video,
  title: 'Sample Test Video.mp4',
  highRes: null,
  blurhash: null,
  favorite: false,
  videoWeb: {
    __typename: 'MediaURL',
    url: '/media/sample_video.mp4',
  },
  thumbnail: {
    __typename: 'MediaURL',
    url: '/media/sample_video_thumb.jpg',
    width: 300,
    height: 200,
  },
}

describe('PresentVideoPlayer Component', () => {
  beforeEach(() => {
    // Mock HTMLMediaElement play/pause with paused property update in JSDOM
    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(function (this: HTMLVideoElement) {
      Object.defineProperty(this, 'paused', { value: false, configurable: true, writable: true })
      return Promise.resolve()
    })
    window.HTMLMediaElement.prototype.pause = vi.fn().mockImplementation(function (this: HTMLVideoElement) {
      Object.defineProperty(this, 'paused', { value: true, configurable: true, writable: true })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renders full video player interface with video element and controls', () => {
    render(<PresentVideoPlayer media={sampleVideoMedia} />)

    // Main container and video element
    expect(screen.getByTestId('netflix-video-player')).toBeInTheDocument()
    const video = screen.getByTestId('present-video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('poster', 'http://localhost:3000/media/sample_video_thumb.jpg')
    expect(video.querySelector('source')).toHaveAttribute('src', 'http://localhost:3000/media/sample_video.mp4')

    // Scrubber, bottom controls and top header
    expect(screen.getByTestId('video-bottom-controls')).toBeInTheDocument()
    expect(screen.getByTestId('video-top-controls')).toBeInTheDocument()
    expect(screen.getByTestId('video-scrubber')).toBeInTheDocument()
    expect(screen.getByTestId('video-play-pause-button')).toBeInTheDocument()
    expect(screen.getByTestId('video-speed-button')).toBeInTheDocument()
    expect(screen.getByText('Sample Test Video.mp4')).toBeInTheDocument()
  })

  test('play / pause button toggles playback state', async () => {
    render(<PresentVideoPlayer media={sampleVideoMedia} />)

    const playPauseBtn = screen.getByTestId('video-play-pause-button')
    expect(playPauseBtn).toHaveAttribute('aria-label', 'Play')

    // Click to play
    await act(async () => {
      fireEvent.click(playPauseBtn)
    })

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled()
    expect(playPauseBtn).toHaveAttribute('aria-label', 'Pause')

    // Click to pause
    await act(async () => {
      fireEvent.click(playPauseBtn)
    })

    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled()
    expect(playPauseBtn).toHaveAttribute('aria-label', 'Play')
  })

  test('spacebar keyboard shortcut toggles play / pause', async () => {
    render(<PresentVideoPlayer media={sampleVideoMedia} />)

    const playPauseBtn = screen.getByTestId('video-play-pause-button')
    expect(playPauseBtn).toHaveAttribute('aria-label', 'Play')

    // Press spacebar to play
    await act(async () => {
      fireEvent.keyDown(window, { key: ' ' })
    })

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled()
    expect(playPauseBtn).toHaveAttribute('aria-label', 'Pause')
  })

  test('speed button cycles playback rate on click and updates video element', () => {
    render(<PresentVideoPlayer media={sampleVideoMedia} />)

    const speedBtn = screen.getByTestId('video-speed-button')
    const video = screen.getByTestId('present-video') as HTMLVideoElement

    expect(speedBtn).toHaveTextContent('1x')

    // Cycle 1: 1x -> 1.25x
    fireEvent.click(speedBtn)
    expect(speedBtn).toHaveTextContent('1.25x')
    expect(video.playbackRate).toBe(1.25)

    // Cycle 2: 1.25x -> 1.5x
    fireEvent.click(speedBtn)
    expect(speedBtn).toHaveTextContent('1.5x')
    expect(video.playbackRate).toBe(1.5)

    // Cycle 3: 1.5x -> 2x
    fireEvent.click(speedBtn)
    expect(speedBtn).toHaveTextContent('2x')
    expect(video.playbackRate).toBe(2)

    // Cycle 4: 2x -> 0.5x
    fireEvent.click(speedBtn)
    expect(speedBtn).toHaveTextContent('0.5x')
    expect(video.playbackRate).toBe(0.5)
  })

  test('speed caret opens dropdown menu and selecting an option sets playbackRate', () => {
    render(<PresentVideoPlayer media={sampleVideoMedia} />)

    const speedBtn = screen.getByTestId('video-speed-button')
    const caret = speedBtn.querySelector('span[title="Choose speed"]')
    expect(caret).toBeInTheDocument()

    // Click caret to open menu
    fireEvent.click(caret!)

    expect(screen.getByText('0.75x')).toBeInTheDocument()
    expect(screen.getByText('1x (Normal)')).toBeInTheDocument()
    expect(screen.getByText('2x')).toBeInTheDocument()

    // Click 2x option
    fireEvent.click(screen.getByText('2x'))
    const video = screen.getByTestId('present-video') as HTMLVideoElement
    expect(video.playbackRate).toBe(2)
    expect(speedBtn).toHaveTextContent('2x')

    // Menu closes after selection
    expect(screen.queryByText('1x (Normal)')).not.toBeInTheDocument()
  })

  test('quick skip buttons rewind and fast-forward time', () => {
    render(<PresentVideoPlayer media={sampleVideoMedia} />)

    const video = screen.getByTestId('present-video') as HTMLVideoElement
    Object.defineProperty(video, 'duration', { value: 120, writable: true })
    video.currentTime = 30

    const rewindBtn = screen.getByTitle('Rewind 10s (J / Left Arrow)')
    const forwardBtn = screen.getByTitle('Forward 10s (L / Right Arrow)')

    // Rewind 10s (30 -> 20)
    fireEvent.click(rewindBtn)
    expect(video.currentTime).toBe(20)

    // Forward 10s (20 -> 30)
    fireEvent.click(forwardBtn)
    expect(video.currentTime).toBe(30)
  })

  test('volume control and mute toggle', () => {
    render(<PresentVideoPlayer media={sampleVideoMedia} />)

    const video = screen.getByTestId('present-video') as HTMLVideoElement
    const muteBtn = screen.getByTitle('Mute (M)')

    // Click mute
    fireEvent.click(muteBtn)
    expect(video.muted).toBe(true)

    // Unmute
    const unmuteBtn = screen.getByTitle('Unmute (M)')
    fireEvent.click(unmuteBtn)
    expect(video.muted).toBe(false)
  })

  test('smart buffering HUD shows on video waiting event and hides on playing', () => {
    render(<PresentVideoPlayer media={sampleVideoMedia} />)

    const video = screen.getByTestId('present-video') as HTMLVideoElement
    Object.defineProperty(video, 'duration', { value: 60, writable: true })

    // Simulate video stall / buffer underrun
    act(() => {
      fireEvent.waiting(video)
    })

    // Buffering overlay should be visible with Buffering text
    expect(screen.getByText(/Buffering/i)).toBeInTheDocument()

    // Simulate buffer recovered and playing resumed
    act(() => {
      fireEvent.playing(video)
    })

    // Buffering overlay should fade/hide
    expect(screen.getByText(/Buffering/i).parentElement).toHaveStyle({ opacity: '0' })
  })

  test('global window mousemove wakes up controls immediately', () => {
    render(<PresentVideoPlayer media={sampleVideoMedia} />)

    const bottomControls = screen.getByTestId('video-bottom-controls')
    expect(bottomControls).toHaveStyle({ opacity: '1' })

    // Trigger window mouse movement
    fireEvent.mouseMove(window, { clientX: 300, clientY: 400 })
    expect(bottomControls).toHaveStyle({ opacity: '1' })
  })

  test('clicking on video area wakes up controls', () => {
    render(<PresentVideoPlayer media={sampleVideoMedia} />)

    const videoContainer = screen.getByTestId('netflix-video-player')
    const bottomControls = screen.getByTestId('video-bottom-controls')

    fireEvent.click(videoContainer)
    expect(bottomControls).toHaveStyle({ opacity: '1' })
  })

  test('time readout toggles remaining time on click', () => {
    render(<PresentVideoPlayer media={sampleVideoMedia} />)

    const video = screen.getByTestId('present-video') as HTMLVideoElement
    Object.defineProperty(video, 'duration', { value: 100, writable: true })
    video.currentTime = 25

    // Trigger loaded metadata and time update
    act(() => {
      fireEvent.loadedMetadata(video)
      fireEvent.timeUpdate(video)
    })

    // Initially shows currentTime / duration: "00:25 / 01:40"
    expect(screen.getByText(/00:25 \/ 01:40/)).toBeInTheDocument()

    // Click to toggle remaining time: "-01:15"
    fireEvent.click(screen.getByText(/00:25 \/ 01:40/))
    expect(screen.getByText(/-01:15/)).toBeInTheDocument()
  })

  test('toolbar buttons invoke photoview callbacks for favorite, info, and filmstrip', () => {
    const onToggleFavorite = vi.fn()
    const onToggleExif = vi.fn()
    const onToggleFilmstrip = vi.fn()

    render(
      <PresentVideoPlayer
        media={sampleVideoMedia}
        onToggleFavorite={onToggleFavorite}
        showExif={false}
        onToggleExif={onToggleExif}
        showFilmstrip={false}
        onToggleFilmstrip={onToggleFilmstrip}
        mediaList={[sampleVideoMedia]}
      />
    )

    // Click favorite button
    const favoriteBtn = screen.getByTitle('Add to favorites (S)')
    fireEvent.click(favoriteBtn)
    expect(onToggleFavorite).toHaveBeenCalledTimes(1)

    // Click EXIF info button
    const infoBtn = screen.getByTitle('Photo & Video Details (I)')
    fireEvent.click(infoBtn)
    expect(onToggleExif).toHaveBeenCalledTimes(1)

    // Click filmstrip button
    const filmstripBtn = screen.getByTitle('Toggle filmstrip (F)')
    fireEvent.click(filmstripBtn)
    expect(onToggleFilmstrip).toHaveBeenCalledTimes(1)
  })
})
