import React from 'react'
import { myTimeline_myTimeline } from './__generated__/myTimeline'
import { TimelineGroup, TimelineGroupAlbum } from './TimelineGallery'
import { GalleryAction } from '../photoGallery/mediaGalleryReducer'
import { isNil } from '../../helpers/utils'

export interface TimelineMediaIndex {
  date: number
  album: number
  media: number
}

export interface TimelineGalleryState {
  presenting: boolean
  timelineGroups: TimelineGroup[]
  activeIndex: TimelineMediaIndex
}

export type TimelineGalleryAction =
  | GalleryAction
  | { type: 'replaceTimelineGroups'; timeline: myTimeline_myTimeline[] }
  | { type: 'selectImage'; index: TimelineMediaIndex }
  | { type: 'openPresentMode'; activeIndex: TimelineMediaIndex }

export const getTimelineImage = ({
  mediaState,
  index,
}: {
  mediaState: TimelineGalleryState
  index: TimelineMediaIndex
}): myTimeline_myTimeline | undefined => {
  const { date, album, media } = index
  return mediaState.timelineGroups[date]?.albums[album]?.media[media]
}

export const getActiveTimelineImage = ({
  mediaState,
}: {
  mediaState: TimelineGalleryState
}): myTimeline_myTimeline | undefined => {
  if (
    mediaState.activeIndex.date === -1 ||
    mediaState.activeIndex.album === -1 ||
    mediaState.activeIndex.media === -1
  ) {
    return undefined
  }

  return getTimelineImage({ mediaState, index: mediaState.activeIndex })
}

export function timelineGalleryReducer(
  state: TimelineGalleryState,
  action: TimelineGalleryAction
): TimelineGalleryState {
  switch (action.type) {
    case 'replaceTimelineGroups': {
      const timelineGroups = convertMediaToTimelineGroups(action.timeline)

      let activeIndex: TimelineMediaIndex = {
        album: -1,
        date: -1,
        media: -1,
      }
      let presenting = state.presenting

      const currentActiveMedia = getActiveTimelineImage({ mediaState: state })

      if (currentActiveMedia) {
        let found = false
        for (let d = 0; d < timelineGroups.length; d++) {
          for (let a = 0; a < timelineGroups[d].albums.length; a++) {
            const mIdx = timelineGroups[d].albums[a].media.findIndex(
              m => m.id === currentActiveMedia.id
            )
            if (mIdx !== -1) {
              activeIndex = { date: d, album: a, media: mIdx }
              found = true
              break
            }
          }
          if (found) break
        }

        if (!found && state.presenting) {
          if (
            timelineGroups.length > 0 &&
            timelineGroups[0].albums.length > 0 &&
            timelineGroups[0].albums[0].media.length > 0
          ) {
            const d = Math.min(
              Math.max(0, state.activeIndex.date),
              timelineGroups.length - 1
            )
            const a = Math.min(
              Math.max(0, state.activeIndex.album),
              timelineGroups[d].albums.length - 1
            )
            const m = Math.min(
              Math.max(0, state.activeIndex.media),
              timelineGroups[d].albums[a].media.length - 1
            )
            activeIndex = { date: d, album: a, media: m }
          } else {
            presenting = false
          }
        }
      }

      return {
        ...state,
        presenting,
        activeIndex,
        timelineGroups,
      }
    }
    case 'nextImage': {
      const { activeIndex, timelineGroups } = state

      if (
        activeIndex.album == -1 &&
        activeIndex.date == -1 &&
        activeIndex.media == -1
      ) {
        return state
      }

      const albumGroups = timelineGroups[activeIndex.date].albums
      const albumMedia = albumGroups[activeIndex.album].media

      if (activeIndex.media < albumMedia.length - 1) {
        return {
          ...state,
          activeIndex: {
            ...state.activeIndex,
            media: activeIndex.media + 1,
          },
        }
      }

      if (activeIndex.album < albumGroups.length - 1) {
        return {
          ...state,
          activeIndex: {
            ...state.activeIndex,
            album: activeIndex.album + 1,
            media: 0,
          },
        }
      }

      if (activeIndex.date < timelineGroups.length - 1) {
        return {
          ...state,
          activeIndex: {
            date: activeIndex.date + 1,
            album: 0,
            media: 0,
          },
        }
      }

      // reached the end
      return state
    }
    case 'previousImage': {
      const { activeIndex } = state

      if (
        activeIndex.album == -1 &&
        activeIndex.date == -1 &&
        activeIndex.media == -1
      ) {
        return state
      }

      if (activeIndex.media > 0) {
        return {
          ...state,
          activeIndex: {
            ...activeIndex,
            media: activeIndex.media - 1,
          },
        }
      }

      if (activeIndex.album > 0) {
        const albumGroups = state.timelineGroups[activeIndex.date].albums
        const albumMedia = albumGroups[activeIndex.album - 1].media

        return {
          ...state,
          activeIndex: {
            ...activeIndex,
            album: activeIndex.album - 1,
            media: albumMedia.length - 1,
          },
        }
      }

      if (activeIndex.date > 0) {
        const albumGroups = state.timelineGroups[activeIndex.date - 1].albums
        const albumMedia = albumGroups[albumGroups.length - 1].media

        return {
          ...state,
          activeIndex: {
            date: activeIndex.date - 1,
            album: albumGroups.length - 1,
            media: albumMedia.length - 1,
          },
        }
      }

      // reached the start
      return state
    }
    case 'selectImage': {
      return {
        ...state,
        activeIndex: typeof action.index === "number" ? state.activeIndex : action.index,
      }
    }
    case 'openPresentMode':
      return {
        ...state,
        presenting: true,
        activeIndex: action.activeIndex,
      }
    case 'closePresentMode': {
      return {
        ...state,
        presenting: false,
      }
    }
  }
}



function convertMediaToTimelineGroups(
  timelineMedia: myTimeline_myTimeline[]
): TimelineGroup[] {
  const timelineGroups: TimelineGroup[] = []
  let albums: TimelineGroupAlbum[] = []
  let nextAlbum: TimelineGroupAlbum | null = null

  const sameDay = (a: string, b: string) => {
    return (
      a.replace(/\d{2}:\d{2}:\d{2}/, '00:00:00') ==
      b.replace(/\d{2}:\d{2}:\d{2}/, '00:00:00')
    )
  }

  for (const media of timelineMedia) {
    if (nextAlbum == null) {
      nextAlbum = {
        id: media.album.id,
        title: media.album.title,
        media: [media],
      }
      continue
    }

    // if date changes
    if (!sameDay(nextAlbum.media[0].date, media.date)) {
      albums.push(nextAlbum)

      timelineGroups.push({
        date: albums[0].media[0].date.replace(/\d{2}:\d{2}:\d{2}/, '00:00:00'),
        albums: albums,
      })
      albums = []
      nextAlbum = {
        id: media.album.id,
        title: media.album.title,
        media: [media],
      }
      continue
    }

    // if album changes
    if (nextAlbum.id != media.album.id) {
      albums.push(nextAlbum)
      nextAlbum = {
        id: media.album.id,
        title: media.album.title,
        media: [media],
      }
      continue
    }

    // same album and date
    nextAlbum.media.push(media)
  }

  if (!isNil(nextAlbum)) {
    albums.push(nextAlbum)

    timelineGroups.push({
      date: albums[0].media[0].date.replace(/\d{2}:\d{2}:\d{2}/, '00:00:00'),
      albums: albums,
    })
  }

  return timelineGroups
}

export const openTimelinePresentMode = ({
  dispatchMedia,
  activeIndex,
}: {
  dispatchMedia: React.Dispatch<TimelineGalleryAction>
  activeIndex: TimelineMediaIndex
}) => {
  dispatchMedia({
    type: 'openPresentMode',
    activeIndex,
  })

  history.pushState({ presenting: true, activeIndex: activeIndex }, '')
}
