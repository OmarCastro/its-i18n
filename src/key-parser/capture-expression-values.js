import { isNumeric } from '../utils/algorithms/number.utils.js'
import { parseISO8601, timeNowFrame } from '../utils/algorithms/time.utils.js'
import { formatters } from './expression-formatters.js'

const defaultFormat = formatters['as is'].format

/** @type {CaptureExpressionMap} */
const baseCaptureExpressions = {
  number: {
    value: 400,
    matchPredicate: () => (text) => isNumeric(text),
    defaultFormat: formatters.number.format,
    isConstant: true,
  },

  string: {
    value: 300,
    matchPredicate: () => (text) =>
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith('\'') && text.endsWith('\'')) ||
      (text.startsWith('`') && text.endsWith('`')),
    defaultFormat,
    isConstant: true,
  },
}

/** @type {CaptureExpressionMap} */
const specialCaptureExpressions = {
  string: {
    value: 1 << 20,
    matchPredicate: (match) => (text) => match === text,
    defaultFormat,
    isConstant: true,
  },

  regex: {
    value: 200,
    matchPredicate: (regexPattern) => {
      const regex = new RegExp(regexPattern)
      return (text) => regex.test(text)
    },
    defaultFormat,
    isConstant: true,
  },

  any: {
    value: 100,
    matchPredicate: () => () => true,
    defaultFormat,
    isConstant: true,
  },
}

/** @type {CaptureExpressionMap} */
const baseTimeCaptureExpressions = {
  // normal times
  'unix timestamp': {
    value: 550,
    matchPredicate: () => (text) => isNumeric(text),
    defaultFormat: formatters.datetime.format,
    isConstant: false,
  },

  'iso 8601': {
    value: 550,
    matchPredicate: () => (text) => !isNaN(parseISO8601(text)),
    defaultFormat: formatters.datetime.format,
    isConstant: false,
  },

  date: {
    value: 500,
    matchPredicate: () => (text) => isNumeric(text) || !isNaN(parseISO8601(text)),
    defaultFormat: formatters.datetime.format,
    isConstant: false,
  },

  'unix millis': {
    value: 550,
    matchPredicate: () => (text) => isNumeric(text),
    defaultFormat: formatters.timestamp.format,
    isConstant: false,
  },
}
/** @type {Record<string, RelativeTimeCaptureExpressionPrefix>} */
const relativeTimeCaptureExpressionPrefix = {
  past: {
    additionalvalue: 50,
    defaultMatchPredicate: (prev) => () => {
      const predicate = prev()
      return (text) => predicate(text) && timeIntervalCaptureExpressionPrefix.millisecond.currentTimeCompare(text) <= 0
    },
  },

  present: {
    additionalvalue: 100,
    defaultMatchPredicate: (prev) => () => {
      const predicate = prev()
      return (text) => predicate(text) && timeIntervalCaptureExpressionPrefix.second.currentTimeCompare(text) === 0
    },
  },

  future: {
    additionalvalue: 50,
    defaultMatchPredicate: (prev) => () => {
      const predicate = prev()
      return (text) => predicate(text) && timeIntervalCaptureExpressionPrefix.millisecond.currentTimeCompare(text) > 0
    },
  },
}

/** @type {Record<string, TimeIntervalCaptureExpressionPrefix>} */
const timeIntervalCaptureExpressionPrefix = {
  millisecond: {
    additionalvalue: 33,
    currentTimeCompare: (text) => {
      const timeText = isNumeric(text) ? new Date((+text) * 1000).valueOf() : parseISO8601(text)
      const timeNow = timeNowFrame()
      return timeText - timeNow
    },
  },

  second: {
    additionalvalue: 30,
    currentTimeCompare: (text) => {
      const timeText = isNumeric(text) ? new Date((+text) * 1000).valueOf() : parseISO8601(text)
      const timeNow = timeNowFrame()
      return Math.floor(timeText / 1000) - Math.floor(timeNow / 1000)
    },
  },

  minute: {
    additionalvalue: 29,
    currentTimeCompare: (text) => {
      const timeText = isNumeric(text) ? new Date((+text) * 1000).valueOf() : parseISO8601(text)
      const timeNow = timeNowFrame()
      return Math.floor(timeText / 60_000) - Math.floor(timeNow / 60_000)
    },
  },

  hour: {
    additionalvalue: 28,
    currentTimeCompare: (text) => {
      const timeText = isNumeric(text) ? new Date((+text) * 1000).valueOf() : parseISO8601(text)
      const timeNow = timeNowFrame()
      return Math.floor(timeText / 360_000) - Math.floor(timeNow / 360_000)
    },
  },

  day: {
    additionalvalue: 27,
    currentTimeCompare: (text) => {
      const timeText = isNumeric(text) ? new Date((+text) * 1000).valueOf() : parseISO8601(text)
      const timeNow = timeNowFrame()
      return Math.floor(timeText / 86_400_000) - Math.floor(timeNow / 86_400_000)
    },
  },

  week: {
    additionalvalue: 26,
    currentTimeCompare: (text) => {
      const date = new Date(isNumeric(text) ? (+text) * 1000 : parseISO8601(text))
      const dateNow = new Date(timeNowFrame())
      const yearNow = dateNow.getFullYear()
      const yearDiff = date.getFullYear() - yearNow
      if (yearDiff !== 0) { return yearDiff }
      const oneJan = new Date(yearNow, 0, 1)
      const oneJanDay = oneJan.getDay()
      const oneJanTimeStamp = oneJan.valueOf()
      const weekNow = Math.ceil((((dateNow.valueOf() - oneJanTimeStamp) / 86400000) + oneJanDay + 1) / 7)
      const week = Math.ceil((((date.valueOf() - oneJanTimeStamp) / 86400000) + oneJanDay + 1) / 7)
      return week - weekNow
    },

  },

  month: {
    additionalvalue: 25,
    currentTimeCompare: (text) => {
      const date = new Date(isNumeric(text) ? (+text) * 1000 : parseISO8601(text))
      const dateNow = new Date(timeNowFrame())
      return date.getFullYear() * 12 + date.getMonth() - dateNow.getFullYear() * 12 + dateNow.getMonth()
    },
  },

  year: {
    additionalvalue: 24,
    currentTimeCompare: (text) => {
      const date = new Date(isNumeric(text) ? (+text) * 1000 : parseISO8601(text))
      const dateNow = new Date(timeNowFrame())
      return date.getFullYear() - dateNow.getFullYear()
    },

  },
}

/**
 * @returns {CaptureExpressionMap} build time capture expressions
 */
function buildTimeCaptureExpressions () {
  const { entries, fromEntries } = Object
  return fromEntries(entries(baseTimeCaptureExpressions).flatMap(([baseKey, baseInfo]) => {
    const result = [[baseKey, baseInfo]]
    for (const [relativePrefixKey, relativePrefixInfo] of entries(relativeTimeCaptureExpressionPrefix)) {
      const infoWithRelTime = {
        ...baseInfo,
        value: baseInfo.value + relativePrefixInfo.additionalvalue,
        matchPredicate: relativePrefixInfo.defaultMatchPredicate(baseInfo.matchPredicate),
      }
      result.push([
        `${relativePrefixKey} ${baseKey}`,
        infoWithRelTime,
      ])
      for (const [intervalKey, intervalInfo] of entries(timeIntervalCaptureExpressionPrefix)) {
        result.push([
          `${relativePrefixKey} ${intervalKey} ${baseKey}`, {
            ...infoWithRelTime,
            value: infoWithRelTime.value + intervalInfo.additionalvalue,
          }])
      }
    }

    return result
  }))
}

export const captureExpressions = {
  special: specialCaptureExpressions,
  named: {
    ...baseCaptureExpressions,
    ...buildTimeCaptureExpressions(),
  },
}

/** @typedef {Record<string, CaptureExpressionInfo>} CaptureExpressionMap */

/**
 * @typedef {object} CaptureExpressionInfo
 *
 * Capture expression information used by key parser, as to get the correct matcher
 * based on the ket priority.
 * @property {number}                value - Priority value of the capture expression, the higher value, the key is used when conflicting keys are found.
 * @property {MatchPredicateCreator} matchPredicate - Match predicate creator. The resulting match predicate is based on the `parameters` used
 *                                                    (e.g. creating a matcher from a regex pattern).
 * @property {FormatCall}            defaultFormat - Default format to be used when no formatter is explicitly applied.
 * @property {boolean}               isConstant - A flag to indicate whether the matcher will always match the same key in a translation map,
 *                                                It helps to decide when to query the translation map for the same key.
 */

/** @typedef {import('./expression-formatters.js').FormatCall} FormatCall */
/** @typedef {(text: string) => boolean} MatchPredicate */
/** @typedef {(...parameters: string[]) => MatchPredicate} MatchPredicateCreator */

/**
 * @typedef {object} TimeIntervalCaptureExpressionPrefix
 * @property {number}                additionalvalue - Additional Priority value of the capture expression, the higher value, the key is used when conflicting keys are found.
 * @property {(timeStr: string) => number} currentTimeCompare - compare text formatted date to current time. returns negative number when `timeStr` is in the past, positive in the future, 0 in the present
 */

/**
 * @typedef {object} RelativeTimeCaptureExpressionPrefix
 * @property {number}                additionalvalue - Additional Priority value of the capture expression, the higher value, the key is used when conflicting keys are found.
 * @property {(prev: MatchPredicateCreator) => MatchPredicateCreator} defaultMatchPredicate - predicate to use when no no time unit is defined (e.g. present **day** date).
 */
