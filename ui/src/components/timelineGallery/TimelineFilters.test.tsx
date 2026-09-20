import { MockedProvider } from '@apollo/client/testing'
import { render, screen, fireEvent } from '@testing-library/react'
import React, { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import TimelineFilters, { EARLIEST_MEDIA_QUERY } from './TimelineFilters'
import { DateFilterState } from './dateFilterHelper'

const earliestMediaMock = [
  {
    request: {
      query: EARLIEST_MEDIA_QUERY,
    },
    result: {
      data: {
        myMedia: [
          {
            __typename: 'Media',
            id: '1001',
            date: '2018-05-10T12:00:00Z',
          },
        ],
      },
    },
  },
]

const Wrapper = ({ initialFilter }: { initialFilter?: DateFilterState }) => {
  const [filter, setFilter] = useState<DateFilterState>(
    initialFilter || { preset: 'all' }
  )
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [onlyVideos, setOnlyVideos] = useState(false)

  return (
    <MockedProvider mocks={earliestMediaMock} addTypename={false}>
      <TimelineFilters
        dateFilter={filter}
        setDateFilter={setFilter}
        onlyFavorites={onlyFavorites}
        setOnlyFavorites={setOnlyFavorites}
        onlyVideos={onlyVideos}
        setOnlyVideos={setOnlyVideos}
      />
    </MockedProvider>
  )
}

describe('TimelineFilters component', () => {
  it('renders date dropdown and filter checkboxes', async () => {
    render(<Wrapper />)

    expect(screen.getByLabelText('Show only favorites')).toBeInTheDocument()
    expect(screen.getByLabelText('Show only videos')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    // No custom inputs when preset is all
    expect(screen.queryByLabelText('Start date')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('End date')).not.toBeInTheDocument()
  })

  it('selecting custom reveals From and To date inputs', async () => {
    render(<Wrapper />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'custom' } })

    expect(await screen.findByLabelText('Start date')).toBeInTheDocument()
    expect(await screen.findByLabelText('End date')).toBeInTheDocument()
  })

  it('entering custom dates renders active filter badge and clearing resets it', async () => {
    render(
      <Wrapper
        initialFilter={{
          preset: 'custom',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        }}
      />
    )

    // Active badge label
    expect(screen.getByText('2024-01-01 → 2024-01-31')).toBeInTheDocument()

    // Click clear button
    const clearBtn = screen.getByRole('button', { name: 'Clear date filter' })
    fireEvent.click(clearBtn)

    // Badge disappears
    expect(screen.queryByText('2024-01-01 → 2024-01-31')).not.toBeInTheDocument()
  })

  it('selecting presets like past_30 shows active badge', async () => {
    render(<Wrapper initialFilter={{ preset: 'past_30' }} />)

    expect(screen.getByText('Past 30 Days')).toBeInTheDocument()
  })
})
