import { MockedProvider } from '@apollo/client/testing'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import TimelineGallery, { MY_TIMELINE_QUERY } from './TimelineGallery'
import { EARLIEST_MEDIA_QUERY } from './TimelineFilters'
import { timelineData } from './timelineTestData'

vi.mock('../../hooks/useScrollPagination')

const earliestMock = {
  request: {
    query: EARLIEST_MEDIA_QUERY,
  },
  result: {
    data: {
      myMedia: [
        {
          __typename: 'Media',
          id: '1054',
          date: '2020-11-09T15:38:09Z',
        },
      ],
    },
  },
}

test('timeline with media', async () => {
  window.history.pushState({}, '', '/timeline')

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
    earliestMock,
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
  window.history.pushState({}, '', '/videos')

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
    earliestMock,
  ]

  render(
    <MemoryRouter initialEntries={['/videos']}>
      <MockedProvider mocks={graphqlMocks}>
        <TimelineGallery defaultOnlyVideos hideVideoCheckbox />
      </MockedProvider>
    </MemoryRouter>
  )

  expect(screen.queryByLabelText('Show only videos')).not.toBeInTheDocument()
  expect(await screen.findAllByRole('img')).toHaveLength(1)
})

test('timeline filters media by custom date range (November 2020 only)', async () => {
  window.history.pushState({}, '', '/timeline?date_from=2020-11-01&date_to=2020-11-30')

  const graphqlMocks = [
    {
      request: {
        query: MY_TIMELINE_QUERY,
        variables: {
          onlyFavorites: false,
          fromDate: '2020-12-01T00:00:00Z',
          offset: 0,
          limit: 200,
        },
      },
      result: {
        data: {
          myTimeline: timelineData,
        },
      },
    },
    earliestMock,
  ]

  render(
    <MemoryRouter initialEntries={['/timeline?date_from=2020-11-01&date_to=2020-11-30']}>
      <MockedProvider mocks={graphqlMocks}>
        <TimelineGallery />
      </MockedProvider>
    </MemoryRouter>
  )

  // Out of 5 media (1 in Dec 2020, 4 in Nov 2020), only 4 in Nov 2020 should match
  expect(await screen.findAllByRole('img')).toHaveLength(4)
  expect(screen.getByText('2020-11-01 → 2020-11-30')).toBeInTheDocument()
})

test('timeline filters media by date range for December 2020 only', async () => {
  window.history.pushState({}, '', '/timeline?date_from=2020-12-01&date_to=2020-12-31')

  const graphqlMocks = [
    {
      request: {
        query: MY_TIMELINE_QUERY,
        variables: {
          onlyFavorites: false,
          fromDate: '2021-01-01T00:00:00Z',
          offset: 0,
          limit: 200,
        },
      },
      result: {
        data: {
          myTimeline: timelineData,
        },
      },
    },
    earliestMock,
  ]

  render(
    <MemoryRouter initialEntries={['/timeline?date_from=2020-12-01&date_to=2020-12-31']}>
      <MockedProvider mocks={graphqlMocks}>
        <TimelineGallery />
      </MockedProvider>
    </MemoryRouter>
  )

  // Exactly 1 media in December 2020 (122A2876.jpg)
  expect(await screen.findAllByRole('img')).toHaveLength(1)
  expect(screen.getByText('2020-12-01 → 2020-12-31')).toBeInTheDocument()
})

test('timeline supports legacy date year filter (?date=2020)', async () => {
  window.history.pushState({}, '', '/timeline?date=2020')

  const graphqlMocks = [
    {
      request: {
        query: MY_TIMELINE_QUERY,
        variables: {
          onlyFavorites: false,
          fromDate: '2021-01-01T00:00:00Z',
          offset: 0,
          limit: 200,
        },
      },
      result: {
        data: {
          myTimeline: timelineData,
        },
      },
    },
    earliestMock,
  ]

  render(
    <MemoryRouter initialEntries={['/timeline?date=2020']}>
      <MockedProvider mocks={graphqlMocks}>
        <TimelineGallery />
      </MockedProvider>
    </MemoryRouter>
  )

  // All 5 media in 2020 match
  expect(await screen.findAllByRole('img')).toHaveLength(5)
  expect(screen.getAllByText('Year 2020').length).toBeGreaterThan(0)
})
