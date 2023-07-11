import { isNumeric } from '../utils/algorithms/number.utils.js'
import { parseISO8601, timeNowFrame } from '../utils/algorithms/time.utils.js'

/** @type {FormatCall} */
const formatAsIs = (text) => text

/** @type {Record<string, Formatter>} */
const baseFormatter = {
  'as is': {
    format: formatAsIs,
  },

  number: {
    format: (text, locale) => Intl.NumberFormat(locale.baseName).format(Number(text)),
  },

  date: {
    format: (text, locale) => {
      const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
      return Intl.DateTimeFormat(locale.baseName, defaultDateFormatOptions).format(date)
    },
  },

  datetime: {
    format: (text, locale) => {
      const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
      return Intl.DateTimeFormat(locale.baseName, defaultDateTimeFormatOptions).format(date)
    },
  },

  timestamp: {
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
}

/** @type {[Intl.RelativeTimeFormatUnit, number][]} */
const durationUnitsEntries = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 365 / 12],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
  ['second', 1000],
]

/** @type {Record<string, Formatter>} */
const baseRelativeTimeFormatter = {
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

/** @type {Record<string, Formatter>} */
const baseInUnitRelativeTimeFormatter = Object.fromEntries(
  durationUnitsEntries.map(([unit, duration]) => {
    return [`in ${unit}s`, {
      format: (text, locale) => {
        const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
        return relativeTimeFormatInUnit(locale, unit, date.valueOf())
      },
      nextFrameRenderer: () => (callback) => {
        const now = Date.now()
        setTimeout(callback, duration - now % duration)
      },

    }]
  }),
)

/** @type {Record<string, Formatter>} */
const baseToUnitRelativeTimeFormatter = Object.fromEntries(
  durationUnitsEntries.map(([unit, duration]) => {
    return [`to ${unit}s`, {
      format: (text, locale) => {
        const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
        return relativeTimeFormatToUnit(locale, unit, date.valueOf())
      },
      nextFrameRenderer: () => (callback) => {
        const now = Date.now()
        setTimeout(callback, duration - now % duration)
      },

    }]
  }),
)

const relativeTimeFormatters = (() => {
  const result = {
    ...baseRelativeTimeFormatter,
  }

  for (const [baseKey] of Object.entries(baseRelativeTimeFormatter)) {
    for (const [unitPostfix, unitParams] of Object.entries(baseInUnitRelativeTimeFormatter)) {
      result[`${baseKey} ${unitPostfix}`] = unitParams
    }

    for (const [unitPostfix, unitParams] of Object.entries(baseToUnitRelativeTimeFormatter)) {
      result[`${baseKey} ${unitPostfix}`] = unitParams
    }
  }

  return result
})()

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

/**
 * Shows relative time based on locale
 *
 * @param {Intl.Locale} locale
 * @param {number} d1 target timestamp
 * @param {number} d2 timestamp to compare, if not defined uses current time
 * @returns {string} formatted relative time
 */
function relativeTimeFormat (locale, d1, d2 = timeNowFrame()) {
  const elapsed = d1 - d2
  const formatter = new Intl.RelativeTimeFormat(locale.baseName, { numeric: 'auto' })

  for (const [unit, duration] of durationUnitsEntries) {
    // "Math.abs" accounts for both "past" & "future" scenarios
    if (Math.abs(elapsed) > duration) {
      return formatter.format(Math.floor(elapsed / duration), unit)
    }
  }
  return formatter.format(0, 'seconds')
}

/**
 * Shows relative time based on locale in units
 *
 * @param {Intl.Locale} locale
 * @param {number} d1 target timestamp
 * @param {number} d2 timestamp to compare, if not defined uses current time
 * @param {Intl.RelativeTimeFormatUnit} unit unit to use on the calc
 * @returns {string} formatted relative time
 */
function relativeTimeFormatInUnit (locale, unit, d1, d2 = timeNowFrame()) {
  const elapsed = d1 - d2
  const formatter = new Intl.RelativeTimeFormat(locale.baseName, { numeric: 'auto' })

  for (const [durationUnit, duration] of durationUnitsEntries) {
    // "Math.abs" accounts for both "past" & "future" scenarios
    if (durationUnit === unit) {
      return formatter.format(Math.floor(elapsed / duration), unit)
    }
  }
  return relativeTimeFormat(locale, d1, d2)
}

/**
 * Shows relative time based on locale, from the longest unit that has a positive value to the selected unit
 *
 * @param {Intl.Locale} locale
 * @param {number} d1 target timestamp
 * @param {number} d2 timestamp to compare, if not defined uses current time
 * @param {Intl.RelativeTimeFormatUnit} toUnit unit to use on the calc
 * @returns {string} formatted relative time
 */
function relativeTimeFormatToUnit (locale, toUnit, d1, d2 = timeNowFrame()) {
  let elapsed = d1 - d2
  const listFormatter = new Intl.ListFormat(locale.baseName, { style: 'long', type: 'conjunction' })

  /**
   *
   * @param {string} unit
   * @param {Intl.NumberFormatOptions["unitDisplay"]} unitDisplay
   * @returns
   */
  const timeUnitFormatter = (unit, unitDisplay = 'long') => Intl.NumberFormat(locale.toString(), { style: 'unit', unit, unitDisplay })
  const list = []

  for (const [unit, duration] of durationUnitsEntries) {
    // "Math.abs" accounts for both "past" & "future" scenarios
    if (Math.abs(elapsed) > duration) {
      const amount = Math.floor(Math.abs(elapsed) / duration)
      list.push(timeUnitFormatter(unit).format(amount))
      elapsed -= amount * duration * Math.sign(elapsed)
    }
    if (unit === toUnit) {
      if (list.length) {
        break
      }
      return relativeTimeFormat(locale, d1, d2)
    }
  }
  return listFormatter.format(list)
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

export const formatters = {
  ...baseFormatter,
  ...relativeTimeFormatters,
}
