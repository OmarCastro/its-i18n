const baseCapureExpressions = {
  'number': {
    value: 400,
  },

  'string': {
    value: 300,
  },
} satisfies CaptureExpressionMap

const specialCapureExpressions = {
  'regex': {
    value: 200,
  },

  'any': {
    value: 100,
  },
} satisfies CaptureExpressionMap

const baseTimeCaptureExpressions = {
  // normal times
  'unix timestamp': {
    value: 550,
  },

  'iso 8601': {
    value: 550,
  },

  'date': {
    value: 500,
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
}

export const captureExpressions = {
  special: specialCapureExpressions,
  named: {
    ...baseCapureExpressions,
    ...timeCaptureExpresions,
  },
}
