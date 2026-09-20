import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Dropdown, { DropdownItem } from '../../primitives/form/Dropdown'
import Checkbox from '../../primitives/form/Checkbox'
import { FavoriteCheckboxProps, FavoritesCheckbox } from '../album/AlbumFilter'
import { ReactComponent as DateIcon } from './icons/date.svg'
import { earliestMedia } from './__generated__/earliestMedia'
import {
  DateFilterState,
  getActiveFilterBadgeLabel,
} from './dateFilterHelper'

export const EARLIEST_MEDIA_QUERY = gql`
  query earliestMedia {
    myMedia(
      order: { order_by: "date_shot", order_direction: ASC }
      paginate: { limit: 1 }
    ) {
      id
      date
    }
  }
`

export type DateSelectorProps = {
  dateFilter: DateFilterState
  setDateFilter(filter: DateFilterState): void
}

export const DateSelector = ({ dateFilter, setDateFilter }: DateSelectorProps) => {
  const { t } = useTranslation()
  const { data, loading } = useQuery<earliestMedia>(EARLIEST_MEDIA_QUERY)

  const items = useMemo<DropdownItem[]>(() => {
    const now = new Date()
    const currentYear = now.getFullYear()

    const baseItems: DropdownItem[] = [
      {
        value: 'all',
        label: t('timeline_filter.date.dropdown_all', 'All time'),
      },
      {
        value: 'on_this_day',
        label: t('timeline_filter.date.on_this_day', '✨ On This Day (Memories)'),
      },
      {
        value: 'past_30',
        label: t('timeline_filter.date.past_30', 'Past 30 days'),
      },
      {
        value: 'past_90',
        label: t('timeline_filter.date.past_90', 'Past 3 months'),
      },
      {
        value: 'past_365',
        label: t('timeline_filter.date.past_365', 'Past 1 year'),
      },
      {
        value: 'this_year',
        label: t('timeline_filter.date.this_year', 'This year ({{year}})', {
          year: currentYear,
        }),
      },
      {
        value: 'last_year',
        label: t('timeline_filter.date.last_year', 'Last year ({{year}})', {
          year: currentYear - 1,
        }),
      },
    ]

    const yearItems: DropdownItem[] = []
    if (data && data.myMedia.length !== 0) {
      const earliestYear = new Date(data.myMedia[0].date).getFullYear()
      for (let y = currentYear - 1; y >= earliestYear; y--) {
        yearItems.push({
          value: `year:${y}`,
          label: t('timeline_filter.date.dropdown_year', 'Year {{year}}', {
            year: y,
          }),
        })
      }
    }

    const customItem: DropdownItem = {
      value: 'custom',
      label: t('timeline_filter.date.custom', 'Custom range...'),
    }

    return [...baseItems, ...yearItems, customItem]
  }, [data, t])

  const selectedValue = useMemo(() => {
    if (dateFilter.preset === 'year' && dateFilter.year) {
      return `year:${dateFilter.year}`
    }
    return dateFilter.preset
  }, [dateFilter.preset, dateFilter.year])

  const handleDropdownChange = (val: string) => {
    if (val === 'all') {
      setDateFilter({ preset: 'all', startDate: null, endDate: null, year: null })
    } else if (val === 'on_this_day') {
      setDateFilter({ preset: 'on_this_day', startDate: null, endDate: null, year: null })
    } else if (val === 'past_30') {
      setDateFilter({ preset: 'past_30', startDate: null, endDate: null, year: null })
    } else if (val === 'past_90') {
      setDateFilter({ preset: 'past_90', startDate: null, endDate: null, year: null })
    } else if (val === 'past_365') {
      setDateFilter({ preset: 'past_365', startDate: null, endDate: null, year: null })
    } else if (val === 'this_year') {
      setDateFilter({ preset: 'this_year', startDate: null, endDate: null, year: null })
    } else if (val === 'last_year') {
      setDateFilter({ preset: 'last_year', startDate: null, endDate: null, year: null })
    } else if (val.startsWith('year:')) {
      const yr = parseInt(val.replace('year:', ''), 10)
      setDateFilter({ preset: 'year', year: yr, startDate: null, endDate: null })
    } else if (val === 'custom') {
      setDateFilter({
        preset: 'custom',
        startDate: dateFilter.startDate || '',
        endDate: dateFilter.endDate || '',
        year: null,
      })
    }
  }

  const badgeLabel = getActiveFilterBadgeLabel(dateFilter)

  return (
    <fieldset className="flex items-center gap-3 flex-wrap">
      <legend id="filter_group_date-label" className="sr-only">
        {t('timeline_filter.date.label', 'Date')}
      </legend>
      <div className="flex items-center gap-2">
        <label
          htmlFor="date-range-select"
          className="inline-flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer select-none"
        >
          <DateIcon
            className="inline-block align-baseline mr-1.5 text-gray-500 dark:text-gray-400 w-4 h-4"
            aria-hidden="true"
          />
          <span>{t('timeline_filter.date.label', 'Date')}</span>
        </label>
        <Dropdown
          id="date-range-select"
          aria-labelledby="filter_group_date-label"
          setSelected={handleDropdownChange}
          value={selectedValue}
          items={items}
          disabled={loading}
          className="h-[36px] text-sm font-medium px-3 pr-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-input-bg text-gray-800 dark:text-gray-100 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
        />
      </div>

      {dateFilter.preset === 'custom' && (
        <div className="flex items-center gap-2.5 bg-white/95 dark:bg-[#1e2533] px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-400 select-none">
              From
            </span>
            <input
              type="date"
              aria-label="Start date"
              value={dateFilter.startDate || ''}
              onClick={e => {
                try {
                  e.currentTarget.showPicker?.()
                } catch {}
              }}
              onChange={e =>
                setDateFilter({
                  ...dateFilter,
                  preset: 'custom',
                  startDate: e.target.value || null,
                })
              }
              className="cursor-pointer bg-gray-50 dark:bg-[#283144] border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm font-medium rounded-md px-3 py-1 h-[34px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:bg-gray-100 dark:hover:bg-[#313c53] transition-colors [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert-[0.8]"
            />
          </div>

          <span className="text-gray-400 dark:text-gray-500 font-bold text-sm select-none px-0.5">
            →
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-400 select-none">
              To
            </span>
            <input
              type="date"
              aria-label="End date"
              value={dateFilter.endDate || ''}
              onClick={e => {
                try {
                  e.currentTarget.showPicker?.()
                } catch {}
              }}
              onChange={e =>
                setDateFilter({
                  ...dateFilter,
                  preset: 'custom',
                  endDate: e.target.value || null,
                })
              }
              className="cursor-pointer bg-gray-50 dark:bg-[#283144] border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm font-medium rounded-md px-3 py-1 h-[34px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:bg-gray-100 dark:hover:bg-[#313c53] transition-colors [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert-[0.8]"
            />
          </div>
        </div>
      )}

      {badgeLabel && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm transition-all">
          <span className="leading-none">{badgeLabel}</span>
          <button
            type="button"
            onClick={() =>
              setDateFilter({
                preset: 'all',
                startDate: null,
                endDate: null,
                year: null,
              })
            }
            aria-label="Clear date filter"
            title="Clear date filter"
            className="hover:bg-blue-200 dark:hover:bg-blue-700/60 text-blue-600 dark:text-blue-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none transition-colors ml-0.5"
          >
            ✕
          </button>
        </div>
      )}
    </fieldset>
  )
}

export type VideoCheckboxProps = {
  onlyVideos: boolean
  setOnlyVideos(videos: boolean): void
  hideVideoCheckbox?: boolean
}

export const VideosCheckbox = ({
  onlyVideos,
  setOnlyVideos,
}: VideoCheckboxProps) => {
  const { t } = useTranslation()

  return (
    <Checkbox
      className="mb-1"
      label={t('timeline_filter.only_videos', 'Show only videos')}
      checked={onlyVideos}
      onChange={e => setOnlyVideos(e.target.checked)}
    />
  )
}

export type TimelineFiltersProps = DateSelectorProps &
  FavoriteCheckboxProps &
  VideoCheckboxProps

const TimelineFilters = ({
  onlyFavorites,
  setOnlyFavorites,
  onlyVideos,
  setOnlyVideos,
  hideVideoCheckbox,
  dateFilter,
  setDateFilter,
}: TimelineFiltersProps) => {
  return (
    <div className="flex items-center gap-4 flex-wrap mb-4">
      <DateSelector dateFilter={dateFilter} setDateFilter={setDateFilter} />
      <FavoritesCheckbox
        onlyFavorites={onlyFavorites}
        setOnlyFavorites={setOnlyFavorites}
      />
      {!hideVideoCheckbox && (
        <VideosCheckbox
          onlyVideos={onlyVideos}
          setOnlyVideos={setOnlyVideos}
        />
      )}
    </div>
  )
}

export default TimelineFilters
