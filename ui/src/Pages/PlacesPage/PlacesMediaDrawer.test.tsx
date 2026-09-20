import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PlacesMediaDrawer from './PlacesMediaDrawer'
import { MediaType } from '../../__generated__/globalTypes'
import { MediaGalleryFields } from '../../components/photoGallery/__generated__/MediaGalleryFields'

const mockPhotos: MediaGalleryFields[] = [
  {
    id: '101',
    title: 'Kyoto Shrine',
    blurhash: null,
    type: MediaType.Photo,
    thumbnail: {
      url: '/photo/kyoto_thumb.jpg',
      width: 300,
      height: 300,
    },
    highRes: {
      url: '/photo/kyoto_high.jpg',
      width: 1920,
      height: 1080,
    },
    videoWeb: null,
  },
  {
    id: '102',
    title: 'Mont Blanc Drone',
    blurhash: null,
    type: MediaType.Video,
    thumbnail: {
      url: '/photo/montblanc_thumb.jpg',
      width: 300,
      height: 300,
    },
    highRes: {
      url: '/photo/montblanc_high.jpg',
      width: 1920,
      height: 1080,
    },
    videoWeb: {
      url: '/video/montblanc.mp4',
      width: 1920,
      height: 1080,
    },
  },
]

describe('PlacesMediaDrawer', () => {
  it('renders drawer with photo count and action buttons when open', () => {
    const handleClose = vi.fn()
    const handleSelectMedia = vi.fn()
    const handlePresentAll = vi.fn()

    render(
      <PlacesMediaDrawer
        open={true}
        mediaList={mockPhotos}
        loading={false}
        onClose={handleClose}
        onSelectMedia={handleSelectMedia}
        onPresentAll={handlePresentAll}
      />
    )

    expect(screen.getByText('2 Photos')).toBeDefined()
    expect(screen.getByText('▶ Slideshow')).toBeDefined()
    expect(screen.getByText('🎬')).toBeDefined() // Video indicator
  })

  it('clicking thumbnail invokes onSelectMedia with correct index', () => {
    const handleClose = vi.fn()
    const handleSelectMedia = vi.fn()
    const handlePresentAll = vi.fn()

    render(
      <PlacesMediaDrawer
        open={true}
        mediaList={mockPhotos}
        loading={false}
        onClose={handleClose}
        onSelectMedia={handleSelectMedia}
        onPresentAll={handlePresentAll}
      />
    )

    const cards = screen.getAllByRole('img')
    expect(cards.length).toBe(2)

    fireEvent.click(cards[1])
    expect(handleSelectMedia).toHaveBeenCalledWith(1)
  })

  it('clicking Slideshow button triggers onPresentAll', () => {
    const handlePresentAll = vi.fn()

    render(
      <PlacesMediaDrawer
        open={true}
        mediaList={mockPhotos}
        loading={false}
        onClose={vi.fn()}
        onSelectMedia={vi.fn()}
        onPresentAll={handlePresentAll}
      />
    )

    fireEvent.click(screen.getByText('▶ Slideshow'))
    expect(handlePresentAll).toHaveBeenCalled()
  })

  it('clicking close button triggers onClose', () => {
    const handleClose = vi.fn()

    render(
      <PlacesMediaDrawer
        open={true}
        mediaList={mockPhotos}
        loading={false}
        onClose={handleClose}
        onSelectMedia={vi.fn()}
        onPresentAll={vi.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText('Close drawer'))
    expect(handleClose).toHaveBeenCalled()
  })
})
