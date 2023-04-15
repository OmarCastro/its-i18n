const baseCapureExpressions = {
  'number': {
    value: 400,
  },

  'string': {
    value: 300,
  },

  'regex': {
    value: 200,
  },

  'any': {},
}

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

const timeIntervaCaptureExpresionPrefix = {
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

const anyCaptureExpression = {
  value: 100,
}
