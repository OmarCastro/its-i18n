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
  },
}

/** @type {Record<string, Formatter>} */
const relativeTimeDurationFormatter = {
  'relative time duration': {
    format: (text, locale) => {
      const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
      return relativeTimeDurationFormat(locale, date.valueOf())
    },
  },
}

/** @type {Record<string, Formatter>} */
const baseInUnitRelativeTimeFormatter = Object.fromEntries(
  durationUnitsEntries.map(([unit]) => {
    return [`in ${unit}s`, {
      format: (text, locale) => {
        const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
        return relativeTimeFormatInUnit(locale, unit, date.valueOf())
      },
    }]
  })
)

/** @type {Record<string, Formatter>} */
const baseDurationInUnitRelativeTimeFormatter = Object.fromEntries(
  durationUnitsEntries.map(([unit]) => {
    return [`in ${unit}s`, {
      format: (text, locale) => {
        const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
        return relativeTimeDurationFormatInUnit(locale, unit, date.valueOf())
      },
    }]
  })
)

/** @type {Record<string, Formatter>} */
const baseToUnitRelativeTimeFormatter = Object.fromEntries(
  durationUnitsEntries.map(([unit, duration]) => {
    return [`to ${unit}s`, {
      format: (text, locale) => {
        const date = isNumeric(text) ? new Date((+text) * 1000) : parseISO8601(text)
        return relativeTimeFormatToUnit(locale, unit, date.valueOf())
      },
    }]
  })
)

const relativeTimeFormatters = (() => {
  const result = {
    ...baseRelativeTimeFormatter,
    ...relativeTimeDurationFormatter,
  }

  for (const [baseKey] of Object.entries(baseRelativeTimeFormatter)) {
    for (const [unitPostfix, unitParams] of Object.entries(baseInUnitRelativeTimeFormatter)) {
      result[`${baseKey} ${unitPostfix}`] = unitParams
    }
  }

  for (const [baseKey] of Object.entries(relativeTimeDurationFormatter)) {
    for (const [unitPostfix, unitParams] of Object.entries(baseDurationInUnitRelativeTimeFormatter)) {
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
 * @param {Intl.Locale} locale - target locale
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
 * Shows relative time based on locale, without any time adverbs such as "ago" (2 minutes ago), "in" (in 5 minutes), tomorrow, yesterday, etc
 * @param {Intl.Locale} locale - target locale
 * @param {number} d1 - target timestamp
 * @param {number} d2 - timestamp to compare, if not defined uses current time
 * @returns {string} formatted relative time
 */
function relativeTimeDurationFormat (locale, d1, d2 = timeNowFrame()) {
  // "Math.abs" accounts for both "past" & "future" scenarios
  const elapsed = Math.abs(d1 - d2)

  for (const [unit, duration] of durationUnitsEntries) {
    // "Math.abs" accounts for both "past" & "future" scenarios
    if (elapsed > duration) {
      return Intl.NumberFormat(locale.baseName, { style: 'unit', unit, unitDisplay: 'long' }).format(Math.floor(elapsed / duration))
    }
  }
  return Intl.NumberFormat(locale.baseName, { style: 'unit', unit: 'seconds', unitDisplay: 'long' }).format(0)
}

/**
 * Shows relative time based on locale in units
 * @param {Intl.Locale} locale - target locale
 * @param {Intl.RelativeTimeFormatUnit} unit - unit to use on the calc
 * @param {number} d1 - target timestamp
 * @param {number} d2 - timestamp to compare, if not defined uses current time
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
 * Shows relative time based on locale in units, without any time adverbs such as "ago" (2 minutes ago), "in" (in 5 minutes), tomorrow, yesterday, etc...
 *
 * When the unit is zero it applies the value in the next unit where the value is above zero (0)
 * @param {Intl.Locale} locale - target locale
 * @param {Intl.RelativeTimeFormatUnit} unit unit to use on the calc
 * @param {number} d1 - target timestamp
 * @param {number} d2 - timestamp to compare, if not defined uses current time
 * @returns {string} formatted relative time
 */
function relativeTimeDurationFormatInUnit (locale, unit, d1, d2 = timeNowFrame()) {
  // "Math.abs" accounts for both "past" & "future" scenarios
  const elapsed = Math.abs(d1 - d2)

  for (const [durationUnit, duration] of durationUnitsEntries) {
    if (durationUnit === unit) {
      if (elapsed < duration) { break }
      return Intl.NumberFormat(locale.baseName, { style: 'unit', unit, unitDisplay: 'long' }).format(Math.floor(elapsed / duration))
    }
  }
  return relativeTimeDurationFormat(locale, d1, d2)
}

/**
 * Shows relative time based on locale, from the longest unit that has a positive value to the selected unit, without any time adverbs such as "ago" (2 minutes ago), "in" (in 5 minutes), tomorrow, yesterday, etc
 * @param {Intl.Locale} locale - target locale
 * @param {Intl.RelativeTimeFormatUnit} toUnit unit to use on the calc
 * @param {number} d1 - target timestamp
 * @param {number} d2 - timestamp to compare, if not defined uses current time
 * @returns {string} formatted relative time
 */
function relativeTimeFormatToUnit (locale, toUnit, d1, d2 = timeNowFrame()) {
  // "Math.abs" accounts for both "past" & "future" scenarios
  let elapsed = Math.abs(d1 - d2)
  const listFormatter = new Intl.ListFormat(locale.baseName, { style: 'long', type: 'conjunction' })
  const list = []

  for (const [unit, duration] of durationUnitsEntries) {
    if (elapsed > duration) {
      const amount = Math.floor(elapsed / duration)
      const timeUnitFormatter = Intl.NumberFormat(locale.baseName, { style: 'unit', unit, unitDisplay: 'long' })
      list.push(timeUnitFormatter.format(amount))
      elapsed -= amount * duration
    }
    if (unit === toUnit) {
      if (list.length) {
        break
      }
      return relativeTimeDurationFormat(locale, d1, d2)
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
 * @property {FormatCall} format   - format function
 * @property {boolean} [isconstant] - flag to tell if format function returns the same result given the same input
 */

export const formatters = {
  ...baseFormatter,
  ...relativeTimeFormatters,
}
