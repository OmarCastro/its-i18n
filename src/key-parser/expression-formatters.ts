import { isNumeric } from '../utils/algorithms/number.utils.js'
import { parseISO8601 } from '../utils/algorithms/time.utils.js'

const formatAsIs = (text: string) => text

const baseFormatter = {
  'as is': {
    format: formatAsIs,
  },

  'number': {
    format: (text: string, locale: Intl.Locale) => Intl.NumberFormat(locale.baseName).format(Number(text)),
  },

  'long date': {
    format: (text: string, locale: Intl.Locale) => Intl.NumberFormat(locale.baseName).format(Number(text)),
  },
  'relative time': {
    format: (text: string, locale: Intl.Locale) => {
      const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
      return relativeTimeFormat(locale, date.valueOf())
    },
  },
} as FormatternMap

/**
 * @type {Record<Intl.RelativeTimeFormatUnit, number>}
 */
const durationUnitsMap = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: 24 * 60 * 60 * 1000 * 365 / 12,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
} as Record<Intl.RelativeTimeFormatUnit, number>

const durationUnitArray = Object.entries(durationUnitsMap).sort(([_1, duration1], [_2, duration2]) => duration2 - duration1) as [
  Intl.RelativeTimeFormatUnit,
  number,
][]

function relativeTimeFormat(locale: Intl.Locale, d1: number, d2 = Date.now()) {
  const elapsed = d1 - d2
  const formatter = new Intl.RelativeTimeFormat(locale.baseName, { numeric: 'auto' })

  for (const [unit, duration] of durationUnitArray) {
    // "Math.abs" accounts for both "past" & "future" scenarios
    if (Math.abs(elapsed) > duration) {
      return formatter.format(Math.floor(elapsed / duration), unit)
    }
  }
  return formatter.format(0, 'seconds')
}

type FormatternMap = {
  [expression: string]: Formatter
}

export type Formatter = {
  format: (text: string, locale: Intl.Locale) => string
}

export const formatters = baseFormatter
