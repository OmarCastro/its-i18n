import { isNumeric } from '../utils/algorithms/number.utils.ts'
import { parseISO8601 } from '../utils/algorithms/time.utils.ts'
import { lazyRegexMatcher } from '../utils/algorithms/regex.utils.ts'
import { formatters } from './expression-formatters.ts'

const defaultFormat = formatters['as is'].format

const baseCapureExpressions = {
  'number': {
    value: 400,
    matchPredicate: () => (text: string) => isNumeric(text),
    defaultFormat: formatters.number.format,
    isConstant: true,
  },

  'string': {
    value: 300,
    matchPredicate: () => (text: string) =>
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith('\'') && text.endsWith('\'')) ||
      (text.startsWith('`') && text.endsWith('`')),
    defaultFormat,
    isConstant: true,
  },
} satisfies CaptureExpressionMap

const specialCapureExpressions = {
  'string': {
    value: 1 << 20,
    matchPredicate: (match: string) => (text: string) => match === text,
    defaultFormat,
    isConstant: true,
  },

  'regex': {
    value: 200,
    matchPredicate: (regexPattern: string) => lazyRegexMatcher(regexPattern),
    defaultFormat,
    isConstant: true,
  },

  'any': {
    value: 100,
    matchPredicate: () => () => true,
    defaultFormat,
    isConstant: true,
  },
} satisfies CaptureExpressionMap

const defaultDateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  fractionalSecondDigits: 3,
  hour12: false,
} as Intl.DateTimeFormatOptions

const baseTimeCaptureExpressions = {
  // normal times
  'unix timestamp': {
    value: 550,
    matchPredicate: () => (text: string) => isNumeric(text),
    defaultFormat: (text: string, locale: Intl.Locale) => {
      return Intl.DateTimeFormat(locale.baseName, defaultDateTimeFormatOptions).format(new Date(+text))
    },
    isConstant: false,
  },

  'iso 8601': {
    value: 550,
    matchPredicate: () => (text: string) => !isNaN(parseISO8601(text)),
    defaultFormat: (text: string, locale: Intl.Locale) => {
      return Intl.DateTimeFormat(locale.baseName, defaultDateTimeFormatOptions).format(parseISO8601(text))
    },
    isConstant: false,
  },

  'date': {
    value: 500,
    matchPredicate: () => (text: string) => isNumeric(text) || !isNaN(parseISO8601(text)),
    defaultFormat: (text: string, locale: Intl.Locale) => {
      const date = isNumeric(text) ? new Date(+text) : parseISO8601(text)
      return Intl.DateTimeFormat(locale.baseName, defaultDateTimeFormatOptions).format(date)
    },
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
} as Record<string, { additionalvalue: number }>

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
} as Record<string, { additionalvalue: number }>

const timeCaptureExpresions = (() => {
  const result = {} as CaptureExpressionMap
  const { entries } = Object
  for (const [baseKey, baseInfo] of entries(baseTimeCaptureExpressions)) {
    result[baseKey] = baseInfo
    for (const [relativePrefixKey, relativePrefixInfo] of entries(relativeTimeCaptureExpresionPrefix)) {
      const infoWithRelTime = {
        ...baseInfo,
        value: baseInfo.value + relativePrefixInfo.additionalvalue,
      }
      result[`${relativePrefixKey} ${baseKey}`] = infoWithRelTime
      for (const [intervalKey, intervalnfo] of entries(timeIntervalCaptureExpresionPrefix)) {
        result[`${relativePrefixKey} ${intervalKey} ${baseKey}`] = {
          ...infoWithRelTime,
          value: infoWithRelTime.value + intervalnfo.additionalvalue,
        }
      }
    }
  }

  return result
})()

type CaptureExpressionMap = {
  [expression: string]: CaptureExpressionInfo
}

/**
 * Capture expression information used by key parser, as to get the correct matcher
 * based on the ket priority.
 */
export type CaptureExpressionInfo = {
  /**
   * Prioriy value of the capture expression, the higher value the key is used when conflicting keys are found.
   */
  value: number
  /**
   * Match predicate creator. The resulting match predicate is based on the `parameters` used
   * (e.g. creating a matcher from a regex pattern).
   *
   * @param parameters - Match predicate creator parameters
   */
  matchPredicate?(...parameters: unknown[]): (text: string) => boolean
  /**
   * Default format to be used when no formatter is explicitly applied.
   *
   * @param text - text to format
   * @param locale - locale used by formatter
   * @returns formatted text
   */
  defaultFormat: (text: string, locale: Intl.Locale) => string
  /**
   * A flag to indicate whether the matcher will always match the same key in a translation map,
   * It helps to decide when to query the translation map for the same key.
   */
  isConstant: boolean
}

export const captureExpressions = {
  special: specialCapureExpressions,
  named: {
    ...baseCapureExpressions,
    ...timeCaptureExpresions,
  },
}
