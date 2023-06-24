import { isNumeric } from '../utils/algorithms/number.utils.js'
import { parseISO8601 } from '../utils/algorithms/time.utils.js'
import { formatters } from './expression-formatters.js'

const defaultFormat = formatters['as is'].format

/** @type {CaptureExpressionMap} */
const baseCapureExpressions = {
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
const specialCapureExpressions = {
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

const relativeTimeCaptureExpresionPrefix = {
  past: {
    additionalvalue: 50,
  },

  present: {
    additionalvalue: 100,
  },

  future: {
    additionalvalue: 50,
  },
}

const timeIntervalCaptureExpresionPrefix = {
  millisecond: {
    additionalvalue: 33,
  },

  second: {
    additionalvalue: 30,
  },

  minute: {
    additionalvalue: 29,
  },

  hour: {
    additionalvalue: 28,
  },

  day: {
    additionalvalue: 27,
  },

  week: {
    additionalvalue: 26,
  },

  month: {
    additionalvalue: 25,
  },

  year: {
    additionalvalue: 24,
  },
}

/**
 *
 * @returns {CaptureExpressionMap}
 */
function buildTimeCaptureExpressions () {
  const { entries, fromEntries } = Object
  return fromEntries(entries(baseTimeCaptureExpressions).flatMap(([baseKey, baseInfo]) => {
    const result = [[baseKey, baseInfo]]
    for (const [relativePrefixKey, relativePrefixInfo] of entries(relativeTimeCaptureExpresionPrefix)) {
      const infoWithRelTime = {
        ...baseInfo,
        value: baseInfo.value + relativePrefixInfo.additionalvalue,
      }
      result.push([
        `${relativePrefixKey} ${baseKey}`,
        infoWithRelTime,
      ])
      for (const [intervalKey, intervalnfo] of entries(timeIntervalCaptureExpresionPrefix)) {
        result.push([
          `${relativePrefixKey} ${intervalKey} ${baseKey}`, {
            ...infoWithRelTime,
            value: infoWithRelTime.value + intervalnfo.additionalvalue,
          }])
      }
    }

    return result
  }))
}

export const captureExpressions = {
  special: specialCapureExpressions,
  named: {
    ...baseCapureExpressions,
    ...buildTimeCaptureExpressions(),
  },
}

/** @typedef {Record<string, CaptureExpressionInfo>} CaptureExpressionMap */

/**
 * @typedef {object} CaptureExpressionInfo
 *
 * Capture expression information used by key parser, as to get the correct matcher
 * based on the ket priority.
 *
 * @property {number}                value - Prioriy value of the capture expression, the higher value, the key is used when conflicting keys are found.
 * @property {MatchPredicateCreator} matchPredicate - Match predicate creator. The resulting match predicate is based on the `parameters` used
 *                                                    (e.g. creating a matcher from a regex pattern).
 * @property {FormatCall}            defaultFormat - Default format to be used when no formatter is explicitly applied.
 * @property {boolean}               isConstant - A flag to indicate whether the matcher will always match the same key in a translation map,
 *                                                It helps to decide when to query the translation map for the same key.
 *
 */

/** @typedef {import('./expression-formatters.js').FormatCall} FormatCall */
/** @typedef {(text: string) => boolean} MatchPredicate */
/** @typedef {(...parameters: string[]) => MatchPredicate} MatchPredicateCreator */
