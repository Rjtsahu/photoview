import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { MediaType } from '../../../__generated__/globalTypes'
import { MediaGalleryFields } from '../__generated__/MediaGalleryFields'
import PresentMedia from './PresentMedia'

const sampleVideoMedia: MediaGalleryFields = {
  __typename: 'Media',
  id: '123',
  type: MediaType.Video,
  highRes: null,
  blurhash: null,
  favorite: false,
  videoWeb: {
    __typename: 'MediaURL',
    url: '/sample_video.mp4',
  },
  thumbnail: {
    __typename: 'MediaURL',
    url: '/sample_video_thumb.jpg',
    width: 300,
    height: 200,
  },
}

test('render present image', () => {
  const media: MediaGalleryFields = {
    __typename: 'Media',
    id: '123',
    type: MediaType.Photo,
    highRes: null,
    blurhash: null,
    videoWeb: null,
    favorite: false,
    thumbnail: {
      __typename: 'MediaURL',
      url: '/sample_image.jpg',
      width: 300,
      height: 200,
    },
  }

  render(<PresentMedia media={media} />)

  expect(screen.getByTestId('present-img-thumbnail')).toHaveAttribute(
    'src',
    'http://localhost:3000/sample_image.jpg'
  )
  expect(screen.getByTestId('present-img-highres')).toHaveStyle({
    display: 'none',
  })
})

test('render present video', () => {
  render(<PresentMedia media={sampleVideoMedia} />)

  expect(screen.getByTestId('present-video')).toHaveAttribute(
    'poster',
    'http://localhost:3000/sample_video_thumb.jpg'
  )

  expect(
    screen.getByTestId('present-video').querySelector('source')
  ).toHaveAttribute('src', 'http://localhost:3000/sample_video.mp4')
})

test('video player bottom toolbar is rendered and visible even when hideControls is true', () => {
  // Even if navigation overlay passes hideControls={true}, the video toolbar must stay visible
  render(<PresentMedia media={sampleVideoMedia} hideControls={true} />)

  const bottomControls = screen.getByTestId('video-bottom-controls')
  expect(bottomControls).toBeInTheDocument()
  expect(bottomControls).toHaveStyle({ opacity: '1' })

  // Check play/pause button, scrubber, and speed controls are present
  expect(screen.getByTestId('video-play-pause-button')).toBeInTheDocument()
  expect(screen.getByTestId('video-scrubber')).toBeInTheDocument()
  expect(screen.getByTestId('video-speed-button')).toBeInTheDocument()
})

test('playback speed button cycles speeds on click', () => {
  render(<PresentMedia media={sampleVideoMedia} />)

  const speedButton = screen.getByTestId('video-speed-button')
  expect(speedButton).toBeInTheDocument()
  expect(speedButton).toHaveTextContent('1x')

  // Click to cycle to 1.25x
  fireEvent.click(speedButton)
  expect(speedButton).toHaveTextContent('1.25x')

  // Click again to cycle to 1.5x
  fireEvent.click(speedButton)
  expect(speedButton).toHaveTextContent('1.5x')
})

test('bottom controls remain visible when hovering over the toolbar', () => {
  render(<PresentMedia media={sampleVideoMedia} />)

  const bottomControls = screen.getByTestId('video-bottom-controls')
  
  // Simulate mouse enter on bottom controls
  fireEvent.mouseEnter(bottomControls)
  expect(bottomControls).toHaveStyle({ opacity: '1' })

  // Simulate mouse leave and re-enter
  fireEvent.mouseLeave(bottomControls)
  fireEvent.mouseEnter(bottomControls)
  expect(bottomControls).toHaveStyle({ opacity: '1' })
})

test('global window mousemove triggers controls visibility', () => {
  render(<PresentMedia media={sampleVideoMedia} />)

  const bottomControls = screen.getByTestId('video-bottom-controls')
  expect(bottomControls).toHaveStyle({ opacity: '1' })

  // Trigger window mousemove
  fireEvent.mouseMove(window, { clientX: 500, clientY: 400 })
  expect(bottomControls).toHaveStyle({ opacity: '1' })
})

test('clicking on video area wakes up controls', () => {
  render(<PresentMedia media={sampleVideoMedia} />)

  const videoContainer = screen.getByTestId('netflix-video-player')
  const bottomControls = screen.getByTestId('video-bottom-controls')

  // Click on video area
  fireEvent.click(videoContainer)
  expect(bottomControls).toHaveStyle({ opacity: '1' })
})
