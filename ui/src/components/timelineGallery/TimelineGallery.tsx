import React, { useState, useRef, useEffect, useReducer, useMemo, useCallback } from 'react'
import { useQuery, gql } from '@apollo/client'
import TimelineGroupDate from './TimelineGroupDate'
import PresentView from '../photoGallery/presentView/PresentView'
import useURLParameters from '../../hooks/useURLParameters'
import useScrollPagination from '../../hooks/useScrollPagination'
import PaginateLoader from '../PaginateLoader'
import { useTranslation } from 'react-i18next'
import {
  myTimeline,
  myTimelineVariables,
  myTimeline_myTimeline,
} from './__generated__/myTimeline'
import {
  getActiveTimelineImage as getActiveTimelineMedia,
  timelineGalleryReducer,
  TimelineMediaIndex,
} from './timelineGalleryReducer'
import { urlPresentModeSetupHook } from '../photoGallery/mediaGalleryReducer'
import TimelineFilters from './TimelineFilters'
import TimelineMapOverlay from './TimelineMapOverlay'
import client from '../../apolloClient'
import {
  DateFilterState,
  parseDateFilterFromUrl,
  getDateFilterBounds,
  matchesDateFilter,
} from './dateFilterHelper'

export const MY_TIMELINE_QUERY = gql`
  query myTimeline(
    $onlyFavorites: Boolean
    $limit: Int
    $offset: Int
    $fromDate: Time
  ) {
    myTimeline(
      onlyFavorites: $onlyFavorites
      paginate: { limit: $limit, offset: $offset }
      fromDate: $fromDate
    ) {
      id
      title
      type
      blurhash
      thumbnail {
        url
        width
        height
      }
      highRes {
        url
        width
        height
      }
      videoWeb {
        url
      }
      favorite
      album {
        id
        title
      }
      date
    }
  }
`

type TimelineGalleryProps = {
  defaultOnlyVideos?: boolean
  hideVideoCheckbox?: boolean
}

const TimelineGallery = ({
  defaultOnlyVideos,
  hideVideoCheckbox,
}: TimelineGalleryProps = {}) => {
  const { t } = useTranslation()

  const { getParam, setParam, setParams } = useURLParameters()

  const onlyFavorites = getParam('favorites') == '1' ? true : false
  const setOnlyFavorites = (favorites: boolean) =>
    setParam('favorites', favorites ? '1' : null)

  const rawVideosParam = getParam('videos')
  const onlyVideos =
    rawVideosParam !== null
      ? rawVideosParam === '1'
      : defaultOnlyVideos ?? false
  const setOnlyVideos = (videos: boolean) => {
    if (defaultOnlyVideos) {
      setParam('videos', videos ? null : '0')
    } else {
      setParam('videos', videos ? '1' : null)
    }
  }

  const dateFilter = useMemo<DateFilterState>(
    () => parseDateFilterFromUrl(getParam),
    [
      getParam('date_preset'),
      getParam('date_year'),
      getParam('date_from'),
      getParam('date_to'),
      getParam('date'),
    ]
  )

  const setDateFilter = useCallback(
    (nextFilter: DateFilterState) => {
      setParams([
        {
          key: 'date_preset',
          value: nextFilter.preset === 'all' ? null : nextFilter.preset,
        },
        {
          key: 'date_year',
          value:
            nextFilter.preset === 'year' && nextFilter.year
              ? `${nextFilter.year}`
              : null,
        },
        {
          key: 'date_from',
          value:
            nextFilter.preset === 'custom' && nextFilter.startDate
              ? nextFilter.startDate
              : null,
        },
        {
          key: 'date_to',
          value:
            nextFilter.preset === 'custom' && nextFilter.endDate
              ? nextFilter.endDate
              : null,
        },
        { key: 'date', value: null },
      ])
    },
    [setParams]
  )

  const dateFilterBounds = useMemo(
    () => getDateFilterBounds(dateFilter),
    [dateFilter]
  )

  const favoritesNeedsRefresh = useRef(false)
  const isInitialMountFilter = useRef(true)
  const [showMap, setShowMap] = useState(false)
  const isInitialMountFav = useRef(true)

  const [mediaState, dispatchMedia] = useReducer(timelineGalleryReducer, {
    presenting: false,
    timelineGroups: [],
    activeIndex: {
      date: -1,
      album: -1,
      media: -1,
    },
  })

  const { data, error, loading, refetch, fetchMore } = useQuery<
    myTimeline,
    myTimelineVariables
  >(MY_TIMELINE_QUERY, {
    variables: {
      onlyFavorites,
      fromDate: dateFilterBounds.backendFromDate,
      offset: 0,
      limit: 200,
    },
  })

  const { containerElem, finished: finishedLoadingMore } =
    useScrollPagination<myTimeline>({
      loading,
      fetchMore,
      data,
      getItems: data => data.myTimeline,
    })

  const timelineData = useMemo(() => {
    let raw = data?.myTimeline || []
    if (onlyVideos) {
      raw = raw.filter(m => m.type?.toLowerCase() === 'video')
    }
    if (dateFilter.preset !== 'all') {
      raw = raw.filter(m => matchesDateFilter(m.date, dateFilterBounds))
    }
    return raw
  }, [data?.myTimeline, onlyVideos, dateFilter.preset, dateFilterBounds])

  useEffect(() => {
    dispatchMedia({
      type: 'replaceTimelineGroups',
      timeline: timelineData,
    })
  }, [timelineData])

  const hasPassedDateRange = useMemo(() => {
    if (dateFilterBounds.isOnThisDay) return false
    if (!dateFilterBounds.startDate) return false
    const raw = data?.myTimeline
    if (!raw || raw.length === 0) return false
    const oldestLoaded = new Date(raw[raw.length - 1].date).getTime()
    return oldestLoaded < dateFilterBounds.startDate.getTime()
  }, [data?.myTimeline, dateFilterBounds])

  useEffect(() => {
    const isFiltered = onlyVideos || dateFilter.preset !== 'all'
    if (
      isFiltered &&
      !finishedLoadingMore &&
      !loading &&
      (data?.myTimeline?.length || 0) > 0 &&
      timelineData.length < 24 &&
      !hasPassedDateRange
    ) {
      fetchMore({
        variables: {
          offset: data?.myTimeline?.length || 0,
        },
      })
    }
  }, [
    onlyVideos,
    dateFilter.preset,
    timelineData.length,
    data?.myTimeline?.length,
    finishedLoadingMore,
    loading,
    fetchMore,
    hasPassedDateRange,
  ])

  const filterKey = `${dateFilter.preset}_${dateFilter.year || ''}_${dateFilterBounds.backendFromDate || ''}`
  useEffect(() => {
    if (isInitialMountFilter.current) {
      isInitialMountFilter.current = false
      return
    }
    ;(async () => {
      await client.resetStore()
      await refetch({
        onlyFavorites,
        fromDate: dateFilterBounds.backendFromDate,
        offset: 0,
        limit: 200,
      })
    })()
  }, [filterKey])

  urlPresentModeSetupHook({
    dispatchMedia,
    openPresentMode: (_event) => {
      dispatchMedia({
        type: 'openPresentMode',
        activeIndex: mediaState.activeIndex,
      })
    },
  })

  useEffect(() => {
    if (isInitialMountFav.current) {
      isInitialMountFav.current = false
      return
    }
    favoritesNeedsRefresh.current = false
    refetch({
      onlyFavorites: onlyFavorites,
    })
  }, [onlyFavorites])

  const flatTimelineMedia = useMemo(() => {
    const list: {
      media: myTimeline_myTimeline
      index: TimelineMediaIndex
    }[] = []
    mediaState.timelineGroups.forEach((group, dateIndex) => {
      group.albums.forEach((album, albumIndex) => {
        album.media.forEach((m, mediaIndex) => {
          list.push({
            media: m,
            index: { date: dateIndex, album: albumIndex, media: mediaIndex },
          })
        })
      })
    })
    return list
  }, [mediaState.timelineGroups])

  if (error) {
    return <div>{error.message}</div>
  }

  const timelineGroups = mediaState.timelineGroups.map((_, i) => (
    <TimelineGroupDate
      key={i}
      groupIndex={i}
      mediaState={mediaState}
      dispatchMedia={dispatchMedia}
    />
  ))

  return (
    <div className="overflow-x-hidden">
      <TimelineFilters
        onlyFavorites={onlyFavorites}
        setOnlyFavorites={setOnlyFavorites}
        onlyVideos={onlyVideos}
        setOnlyVideos={setOnlyVideos}
        hideVideoCheckbox={hideVideoCheckbox}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        showMap={showMap}
        onToggleMap={() => setShowMap(!showMap)}
      />
      {showMap && (
        <TimelineMapOverlay
          mediaItems={flatTimelineMedia}
          onSelectMedia={(idx) => {
            dispatchMedia({
              type: 'selectImage',
              index: idx,
            })
          }}
          onClose={() => setShowMap(false)}
        />
      )}
      <div className="-mx-3 flex flex-wrap" ref={containerElem}>
        {timelineGroups}
      </div>
      <PaginateLoader
        active={!finishedLoadingMore && !loading}
        text={t('general.loading.paginate.media', 'Loading more media')}
      />
      {mediaState.presenting && getActiveTimelineMedia({ mediaState }) && (
        <PresentView
          activeMedia={getActiveTimelineMedia({ mediaState })!}
          dispatchMedia={dispatchMedia}
          mediaList={flatTimelineMedia.map(x => x.media)}
          onSelectMedia={(_media, index) => {
            if (flatTimelineMedia[index]) {
              dispatchMedia({
                type: 'selectImage',
                index: flatTimelineMedia[index].index,
              })
            }
          }}
        />
      )}
    </div>
  )
}

export default TimelineGallery