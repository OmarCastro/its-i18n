

const baseCapureExpressions = {
  'number': {
    value: 400,
    matchPredicate: () => (text: string) => isNumeric(text)
  },

  'string': {
    value: 300,
    matchPredicate: () => (text: string) => text.startsWith('"') && text.endsWith('"')
  },
} satisfies CaptureExpressionMap

const specialCapureExpressions = {

  'string': {
    value: 1 << 20,
    matchPredicate: (match: string) => (text: string) => match === text
  },

  'regex': {
    value: 200,
    matchPredicate: (regexPattern: string) => {
      let result = (text: string) => {
        const regex = new RegExp(regexPattern)
        result = (text: string) => text.match(regex)
        return result(text)
      }
      return (text: string) => result(text)
    }
  },

  'any': {
    value: 100,
    matchPredicate: () => () => true
  },
} satisfies CaptureExpressionMap


const baseTimeCaptureExpressions = {
  // normal times
  'unix timestamp': {
    value: 550,
    matchPredicate: () => {
      return (text: string) => isNumeric(text)
    }

  },

  'iso 8601': {
    value: 550,
    matchPredicate: () => {
      const iso8601Regex = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d)/
      return (text: string) => text.match(iso8601Regex) && !isNaN(Date.parse(text))
    }
  },

  'date': {
    value: 500,
    matchPredicate: (regexPattern: string) => {
      let result = (text: string) => {
        const regex = new RegExp(regexPattern)
        result = (text: string) => text.match(regex)
        return result(text)
      }
      return (text: string) => result(text)
    }
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
  matchPredicate?(...match: any[]): (text: string) => boolean
}

export const captureExpressions = {
  special: specialCapureExpressions,
  named: {
    ...baseCapureExpressions,
    ...timeCaptureExpresions,
  },
}


function isNumeric(str: string) {
  return typeof str === "string" && !isNaN(str as any) && !isNaN(parseFloat(str)) 
}
