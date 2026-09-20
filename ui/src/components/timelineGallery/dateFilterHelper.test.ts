import { describe, it, expect } from 'vitest'
import {
  getDateFilterBounds,
  matchesDateFilter,
  getActiveFilterBadgeLabel,
  parseDateFilterFromUrl,
  parseLocalDate,
  formatLocalDate,
  DateFilterState,
} from './dateFilterHelper'

describe('dateFilterHelper', () => {
  const referenceDate = new Date(2026, 8, 19, 14, 30, 0) // Sep 19, 2026

  it('parseLocalDate & formatLocalDate handle dates cleanly without TZ shift', () => {
    const d = parseLocalDate('2024-05-12', false)
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(4) // May is 4
    expect(d.getDate()).toBe(12)
    expect(d.getHours()).toBe(0)

    const end = parseLocalDate('2024-05-12', true)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
    expect(end.getSeconds()).toBe(59)

    expect(formatLocalDate(d)).toBe('2024-05-12')
  })

  it('handles all preset', () => {
    const bounds = getDateFilterBounds({ preset: 'all' }, referenceDate)
    expect(bounds.startDate).toBeNull()
    expect(bounds.endDate).toBeNull()
    expect(bounds.isOnThisDay).toBe(false)
    expect(bounds.backendFromDate).toBeUndefined()

    expect(matchesDateFilter('2024-01-01T00:00:00Z', bounds, referenceDate)).toBe(true)
    expect(getActiveFilterBadgeLabel({ preset: 'all' }, referenceDate)).toBeNull()
  })

  it('handles on_this_day memories preset', () => {
    const bounds = getDateFilterBounds({ preset: 'on_this_day' }, referenceDate)
    expect(bounds.isOnThisDay).toBe(true)
    expect(bounds.startDate).toBeNull()
    expect(bounds.endDate).toBeNull()

    // Same month and day in 2024 (prior year) -> match
    expect(matchesDateFilter(new Date(2024, 8, 19, 10, 0, 0), bounds, referenceDate)).toBe(true)
    // Same month and day in 2020 (prior year) -> match
    expect(matchesDateFilter(new Date(2020, 8, 19, 15, 30, 0), bounds, referenceDate)).toBe(true)
    // Same day but CURRENT year (2026) -> memories are from past years, not today
    expect(matchesDateFilter(new Date(2026, 8, 19, 10, 0, 0), bounds, referenceDate)).toBe(false)
    // Different day (Sep 20, 2024) -> no match
    expect(matchesDateFilter(new Date(2024, 8, 20, 10, 0, 0), bounds, referenceDate)).toBe(false)
    // Different month (Aug 19, 2024) -> no match
    expect(matchesDateFilter(new Date(2024, 7, 19, 10, 0, 0), bounds, referenceDate)).toBe(false)

    expect(getActiveFilterBadgeLabel({ preset: 'on_this_day' }, referenceDate)).toBe('On This Day')
  })

  it('handles relative presets (past_30, past_90, past_365)', () => {
    const p30 = getDateFilterBounds({ preset: 'past_30' }, referenceDate)
    expect(p30.startDate).not.toBeNull()
    expect(p30.endDate).not.toBeNull()
    // 10 days ago matches
    const tenDaysAgo = new Date(2026, 8, 9, 12, 0, 0)
    expect(matchesDateFilter(tenDaysAgo, p30, referenceDate)).toBe(true)
    // 40 days ago does not match
    const fortyDaysAgo = new Date(2026, 7, 10, 12, 0, 0)
    expect(matchesDateFilter(fortyDaysAgo, p30, referenceDate)).toBe(false)

    expect(getActiveFilterBadgeLabel({ preset: 'past_30' }, referenceDate)).toBe('Past 30 Days')
    expect(getActiveFilterBadgeLabel({ preset: 'past_90' }, referenceDate)).toBe('Past 3 Months')
    expect(getActiveFilterBadgeLabel({ preset: 'past_365' }, referenceDate)).toBe('Past 1 Year')
  })

  it('handles this_year and last_year', () => {
    const thisYear = getDateFilterBounds({ preset: 'this_year' }, referenceDate)
    expect(thisYear.startDate?.getFullYear()).toBe(2026)
    expect(matchesDateFilter(new Date(2026, 2, 10), thisYear, referenceDate)).toBe(true)
    expect(matchesDateFilter(new Date(2025, 11, 31), thisYear, referenceDate)).toBe(false)

    const lastYear = getDateFilterBounds({ preset: 'last_year' }, referenceDate)
    expect(lastYear.startDate?.getFullYear()).toBe(2025)
    expect(lastYear.backendFromDate).toBe('2026-01-01T00:00:00Z')
    expect(matchesDateFilter(new Date(2025, 5, 1), lastYear, referenceDate)).toBe(true)
    expect(matchesDateFilter(new Date(2024, 5, 1), lastYear, referenceDate)).toBe(false)
  })

  it('handles specific year preset', () => {
    const y2023 = getDateFilterBounds({ preset: 'year', year: 2023 }, referenceDate)
    expect(y2023.startDate?.getFullYear()).toBe(2023)
    expect(y2023.backendFromDate).toBe('2024-01-01T00:00:00Z')
    expect(matchesDateFilter(new Date(2023, 6, 15), y2023, referenceDate)).toBe(true)
    expect(matchesDateFilter(new Date(2022, 6, 15), y2023, referenceDate)).toBe(false)
    expect(matchesDateFilter(new Date(2024, 0, 1), y2023, referenceDate)).toBe(false)
    expect(getActiveFilterBadgeLabel({ preset: 'year', year: 2023 }, referenceDate)).toBe('Year 2023')
  })

  it('handles custom date range', () => {
    const custom = getDateFilterBounds({
      preset: 'custom',
      startDate: '2024-06-01',
      endDate: '2024-06-15',
    }, referenceDate)

    expect(matchesDateFilter(new Date(2024, 5, 1, 10, 0), custom, referenceDate)).toBe(true)
    expect(matchesDateFilter(new Date(2024, 5, 15, 22, 0), custom, referenceDate)).toBe(true)
    expect(matchesDateFilter(new Date(2024, 4, 31, 23, 59), custom, referenceDate)).toBe(false)
    expect(matchesDateFilter(new Date(2024, 5, 16, 0, 1), custom, referenceDate)).toBe(false)
    expect(getActiveFilterBadgeLabel({
      preset: 'custom',
      startDate: '2024-06-01',
      endDate: '2024-06-15',
    }, referenceDate)).toBe('2024-06-01 → 2024-06-15')
  })

  it('parses URL query params including legacy date param', () => {
    // legacy date=2024
    const legacy = parseDateFilterFromUrl((k) => (k === 'date' ? '2024' : null))
    expect(legacy).toEqual({ preset: 'year', year: 2024 })

    // custom date_from and date_to
    const custom = parseDateFilterFromUrl((k) => {
      if (k === 'date_from') return '2023-01-01'
      if (k === 'date_to') return '2023-03-31'
      return null
    })
    expect(custom).toEqual({
      preset: 'custom',
      startDate: '2023-01-01',
      endDate: '2023-03-31',
    })

    // explicit preset
    const preset = parseDateFilterFromUrl((k) => {
      if (k === 'date_preset') return 'past_30'
      return null
    })
    expect(preset).toEqual({
      preset: 'past_30',
      year: null,
      startDate: null,
      endDate: null,
    })
  })
})
