import { isNumeric } from '../utils/algorithms/number.utils.ts'
import { parseISO8601 } from '../utils/algorithms/time.utils.ts'
import { lazyRegexMatcher } from '../utils/algorithms/regex.utils.ts'

const baseCapureExpressions = {
  'number': {
    value: 400,
    matchPredicate: () => (text: string) => isNumeric(text),
  },

  'string': {
    value: 300,
    matchPredicate: () => (text: string) => text.startsWith('"') && text.endsWith('"'),
  },
} satisfies CaptureExpressionMap

const specialCapureExpressions = {
  'string': {
    value: 1 << 20,
    matchPredicate: (match: string) => (text: string) => match === text,
  },

  'regex': {
    value: 200,
    matchPredicate: (regexPattern: string) => lazyRegexMatcher(regexPattern),
  },

  'any': {
    value: 100,
    matchPredicate: () => () => true,
  },
} satisfies CaptureExpressionMap

const baseTimeCaptureExpressions = {
  // normal times
  'unix timestamp': {
    value: 550,
    matchPredicate: () => (text: string) => isNumeric(text),
  },

  'iso 8601': {
    value: 550,
    matchPredicate: () => (text: string) => !isNaN(parseISO8601(text)),
  },

  'date': {
    value: 500,
    matchPredicate: () => (text: string) => isNumeric(text) || !isNaN(parseISO8601(text)),
  },
} as Record<string, { value: number }>

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

type CaptureExpressionInfo = {
  value: number
  matchPredicate?(...match: unknown[]): (text: string) => boolean
}

export const captureExpressions = {
  special: specialCapureExpressions,
  named: {
    ...baseCapureExpressions,
    ...timeCaptureExpresions,
  },
}