import { MockedProvider } from '@apollo/client/testing'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import TimelineGallery, { MY_TIMELINE_QUERY } from './TimelineGallery'
import { timelineData } from './timelineTestData'

vi.mock('../../hooks/useScrollPagination')

test('timeline with media', async () => {
  const graphqlMocks = [
    {
      request: {
        query: MY_TIMELINE_QUERY,
        variables: { onlyFavorites: false, offset: 0, limit: 200 },
      },
      result: {
        data: {
          myTimeline: timelineData,
        },
      },
    },
  ]

  render(
    <MemoryRouter initialEntries={['/timeline']}>
      <MockedProvider mocks={graphqlMocks}>
        <TimelineGallery />
      </MockedProvider>
    </MemoryRouter>
  )

  expect(screen.queryByLabelText('Show only favorites')).toBeInTheDocument()
  expect(screen.queryByLabelText('Show only videos')).toBeInTheDocument()

  expect(await screen.findAllByRole('link')).toHaveLength(4)
  expect(await screen.findAllByRole('img')).toHaveLength(5)
})

test('timeline with defaultOnlyVideos for dedicated videos page', async () => {
  const mixedData = [
    ...timelineData,
    {
      __typename: 'Media' as const,
      id: '2001',
      title: 'my_video.mp4',
      type: 'video' as any,
      thumbnail: {
        __typename: 'MediaURL' as const,
        url: '/photo/thumbnail_video.jpg',
        width: 1024,
        height: 576,
      },
      highRes: null,
      videoWeb: {
        __typename: 'MediaURL' as const,
        url: '/video/web.mp4',
      },
      favorite: false,
      album: { __typename: 'Album' as const, id: '522', title: 'random' },
      date: '2020-12-14T10:00:00Z',
      blurhash: null,
    },
  ]

  const graphqlMocks = [
    {
      request: {
        query: MY_TIMELINE_QUERY,
        variables: { onlyFavorites: false, offset: 0, limit: 200 },
      },
      result: {
        data: {
          myTimeline: mixedData,
        },
      },
    },
  ]

  render(
    <MemoryRouter initialEntries={['/videos']}>
      <MockedProvider mocks={graphqlMocks}>
        <TimelineGallery defaultOnlyVideos hideVideoCheckbox />
      </MockedProvider>
    </MemoryRouter>
  )

  // hideVideoCheckbox hides the checkbox
  expect(screen.queryByLabelText('Show only videos')).not.toBeInTheDocument()

  // Only the 1 video should be displayed out of 6 items
  expect(await screen.findAllByRole('img')).toHaveLength(1)
})
