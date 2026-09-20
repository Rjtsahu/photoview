export type DateFilterPreset =
  | 'all'
  | 'on_this_day'
  | 'past_30'
  | 'past_90'
  | 'past_365'
  | 'this_year'
  | 'last_year'
  | 'year'
  | 'custom'

export type DateFilterState = {
  preset: DateFilterPreset
  year?: number | null
  startDate?: string | null // "YYYY-MM-DD"
  endDate?: string | null   // "YYYY-MM-DD"
}

export type DateFilterBounds = {
  startDate: Date | null
  endDate: Date | null
  isOnThisDay: boolean
  backendFromDate: string | undefined
}

export function parseLocalDate(dateStr: string, endOfDay = false): Date {
  const parts = dateStr.split('-').map(Number)
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return new Date(NaN)
  }
  const [year, month, day] = parts
  if (endOfDay) {
    return new Date(year, month - 1, day, 23, 59, 59, 999)
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getDateFilterBounds(
  filter: DateFilterState,
  referenceDate: Date = new Date()
): DateFilterBounds {
  const currentYear = referenceDate.getFullYear()

  switch (filter.preset) {
    case 'on_this_day':
      return {
        startDate: null,
        endDate: null,
        isOnThisDay: true,
        backendFromDate: undefined,
      }

    case 'past_30': {
      const start = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate() - 30,
        0,
        0,
        0,
        0
      )
      const end = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate(),
        23,
        59,
        59,
        999
      )
      return {
        startDate: start,
        endDate: end,
        isOnThisDay: false,
        backendFromDate: undefined,
      }
    }

    case 'past_90': {
      const start = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate() - 90,
        0,
        0,
        0,
        0
      )
      const end = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate(),
        23,
        59,
        59,
        999
      )
      return {
        startDate: start,
        endDate: end,
        isOnThisDay: false,
        backendFromDate: undefined,
      }
    }

    case 'past_365': {
      const start = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate() - 365,
        0,
        0,
        0,
        0
      )
      const end = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate(),
        23,
        59,
        59,
        999
      )
      return {
        startDate: start,
        endDate: end,
        isOnThisDay: false,
        backendFromDate: undefined,
      }
    }

    case 'this_year': {
      const start = new Date(currentYear, 0, 1, 0, 0, 0, 0)
      const end = new Date(currentYear, 11, 31, 23, 59, 59, 999)
      return {
        startDate: start,
        endDate: end,
        isOnThisDay: false,
        backendFromDate: undefined,
      }
    }

    case 'last_year': {
      const lastYear = currentYear - 1
      const start = new Date(lastYear, 0, 1, 0, 0, 0, 0)
      const end = new Date(lastYear, 11, 31, 23, 59, 59, 999)
      return {
        startDate: start,
        endDate: end,
        isOnThisDay: false,
        backendFromDate: `${currentYear}-01-01T00:00:00Z`,
      }
    }

    case 'year': {
      const targetYear = filter.year || currentYear
      const start = new Date(targetYear, 0, 1, 0, 0, 0, 0)
      const end = new Date(targetYear, 11, 31, 23, 59, 59, 999)
      return {
        startDate: start,
        endDate: end,
        isOnThisDay: false,
        backendFromDate: `${targetYear + 1}-01-01T00:00:00Z`,
      }
    }

    case 'custom': {
      const start = filter.startDate ? parseLocalDate(filter.startDate, false) : null
      const end = filter.endDate ? parseLocalDate(filter.endDate, true) : null
      let backendFromDate: string | undefined = undefined

      if (filter.endDate) {
        const parts = filter.endDate.split('-').map(Number)
        if (parts.length >= 3) {
          const nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1)
          const y = nextDay.getFullYear()
          const m = String(nextDay.getMonth() + 1).padStart(2, '0')
          const d = String(nextDay.getDate()).padStart(2, '0')
          backendFromDate = `${y}-${m}-${d}T00:00:00Z`
        }
      }

      return {
        startDate: start && !isNaN(start.getTime()) ? start : null,
        endDate: end && !isNaN(end.getTime()) ? end : null,
        isOnThisDay: false,
        backendFromDate,
      }
    }

    case 'all':
    default:
      return {
        startDate: null,
        endDate: null,
        isOnThisDay: false,
        backendFromDate: undefined,
      }
  }
}

export function matchesDateFilter(
  mediaDate: string | Date,
  bounds: DateFilterBounds,
  referenceDate: Date = new Date()
): boolean {
  const d = typeof mediaDate === 'string' ? new Date(mediaDate) : mediaDate
  if (isNaN(d.getTime())) return false

  if (bounds.isOnThisDay) {
    return (
      d.getMonth() === referenceDate.getMonth() &&
      d.getDate() === referenceDate.getDate() &&
      d.getFullYear() < referenceDate.getFullYear()
    )
  }

  const time = d.getTime()
  if (bounds.startDate && time < bounds.startDate.getTime()) {
    return false
  }
  if (bounds.endDate && time > bounds.endDate.getTime()) {
    return false
  }

  return true
}

export function getActiveFilterBadgeLabel(
  filter: DateFilterState,
  referenceDate: Date = new Date()
): string | null {
  const currentYear = referenceDate.getFullYear()

  switch (filter.preset) {
    case 'on_this_day':
      return 'On This Day'
    case 'past_30':
      return 'Past 30 Days'
    case 'past_90':
      return 'Past 3 Months'
    case 'past_365':
      return 'Past 1 Year'
    case 'this_year':
      return `This Year (${currentYear})`
    case 'last_year':
      return `Last Year (${currentYear - 1})`
    case 'year':
      return filter.year ? `Year ${filter.year}` : null
    case 'custom':
      if (filter.startDate && filter.endDate) {
        return `${filter.startDate} → ${filter.endDate}`
      } else if (filter.startDate) {
        return `From ${filter.startDate}`
      } else if (filter.endDate) {
        return `Until ${filter.endDate}`
      }
      return 'Custom Range'
    case 'all':
    default:
      return null
  }
}

export function parseDateFilterFromUrl(
  getParam: (key: string, defaultValue?: string | null) => string | null
): DateFilterState {
  const presetParam = getParam('date_preset') as DateFilterPreset | null
  const yearParam = getParam('date_year')
  const fromParam = getParam('date_from')
  const toParam = getParam('date_to')
  const legacyDate = getParam('date')

  if (presetParam) {
    return {
      preset: presetParam,
      year: yearParam ? parseInt(yearParam, 10) : null,
      startDate: fromParam || null,
      endDate: toParam || null,
    }
  }

  if (fromParam || toParam) {
    return {
      preset: 'custom',
      startDate: fromParam || null,
      endDate: toParam || null,
    }
  }

  if (legacyDate) {
    const parsedYear = parseInt(legacyDate, 10)
    if (!isNaN(parsedYear)) {
      return {
        preset: 'year',
        year: parsedYear,
      }
    }
  }

  return {
    preset: 'all',
  }
}
