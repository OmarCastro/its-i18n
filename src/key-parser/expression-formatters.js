import { isNumeric } from '../utils/algorithms/number.utils.js'
import { parseISO8601 } from '../utils/algorithms/time.utils.js'

/** @type {FormatCall} */
const formatAsIs = (text) => text

/** @type {Record<string, Formatter>} */
const baseFormatter = {
  'as is': {
    format: formatAsIs,
  },

  'number': {
    format: (text, locale) => Intl.NumberFormat(locale.baseName).format(Number(text)),
  },

  'date': {
    format: (text, locale) => {
      const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
      return Intl.DateTimeFormat(locale.baseName, defaultDateFormatOptions).format(date)
    },
  },

  'datetime': {
    format: (text, locale) => {
      const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
      return Intl.DateTimeFormat(locale.baseName, defaultDateTimeFormatOptions).format(date)
    },
  },

  'timestamp': {
    format: (text, locale) => {
      const date = isNumeric(text) ? new Date(+text) : parseISO8601(text)
      return Intl.DateTimeFormat(locale.baseName, timestampFormatOptions).format(date)
    },
  },

  'long date': {
    format: (text, locale) => {
      const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
      return Intl.DateTimeFormat(locale.baseName, longDateFormatOptions).format(date)
    },
  },

  'long datetime': {
    format: (text, locale) => {
      const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
      return Intl.DateTimeFormat(locale.baseName, longDateTimeFormatOptions).format(date)
    },
  },

  'relative time': {
    format: (text, locale) => {
      const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
      return relativeTimeFormat(locale, date.valueOf())
    },
    nextFrameRenderer: () => (callback) => {
      const now = Date.now()
      setTimeout(callback, 1000 - now % 1000)
    },
  },
}

/** @type {Intl.DateTimeFormatOptions} */
const defaultDateTimeFormatOptions = {
  dateStyle: 'short',
  timeStyle: 'medium',
}

/** @type {Intl.DateTimeFormatOptions} */
const defaultDateFormatOptions = {
  dateStyle: 'short',
}

/** @type {Intl.DateTimeFormatOptions} */
const timestampFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  fractionalSecondDigits: 3,
  hour12: false,
}

/** @type {Intl.DateTimeFormatOptions} */
const longDateFormatOptions = {
  dateStyle: 'long',
}

/** @type {Intl.DateTimeFormatOptions} */
const longDateTimeFormatOptions = {
  dateStyle: 'long',
  timeStyle: 'long',
}

/** @type {[Intl.RelativeTimeFormatUnit, number][]} */
const durationUnits = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 365 / 12],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
  ['second', 1000],
]

/**
 * Shows relative time based on locale
 *
 * @param {Intl.Locale} locale
 * @param {number} d1 target timestamp
 * @param {number} d2 timestamp to compare, if not defined uses current time
 * @returns formatted relative time
 */
function relativeTimeFormat(locale, d1, d2 = Date.now()) {
  const elapsed = d1 - d2
  const formatter = new Intl.RelativeTimeFormat(locale.baseName, { numeric: 'auto' })

  for (const [unit, duration] of durationUnits) {
    // "Math.abs" accounts for both "past" & "future" scenarios
    if (Math.abs(elapsed) > duration) {
      return formatter.format(Math.floor(elapsed / duration), unit)
    }
  }
  return formatter.format(0, 'seconds')
}

/**
 * @typedef {Record<string, Formatter>} FormatterMap
 */

/**
 * @callback FormatCall
 * @param {string}       text   - text input
 * @param {Intl.Locale}  locale - internationalization locale
 * @returns {string}     fomatted text
 */

/**
 * @typedef {object} Formatter
 * @property {FormatCall} format
 * @property {() => (callback: () => void) => void} [nextFrameRenderer]
 */

export const formatters = baseFormatter
