import { states } from './key-ast.util.js'
import { formatters as expressionFormatters } from './expression-formatters.js'
import { isInteger } from '../utils/algorithms/number.utils.js'

/** @type {readonly never[]} */
const emptyArray = Object.freeze([])

/**
 * Add or replace format method from templateFormatter object
 *
 * @param {Omit<TemplateFormatter, 'format'>} templateFormatter
 * @returns {TemplateFormatter}
 */
const formatterWithFormat = (templateFormatter) => ({
  ...templateFormatter,
  format: (parameters, locale, defaultFormatters) => {
    const { strings, formatters } = templateFormatter
    let result = strings[0]
    for (let i = 1, e = strings.length; i < e; ++i) {
      result += formatters[i - 1](parameters, locale, defaultFormatters) + strings[i]
    }
    return result
  },
})

/**
 * Returns a formatter that returns the `value` content
 *
 * Used when the value does not have parameters
 *
 * @param {string} value
 * @returns {TemplateFormatter}
 */
const formatSimpleKey = (value) => ({
  strings: [value],
  formatters: emptyArray,
  format: () => value,
})

/**
 * @param {[string, CaptureExpressionsInfoDetail[]]} acc
 * @param {Token} token - captureChildToken
 * @returns {[string, CaptureExpressionsInfoDetail[]]}
 */
function parseCaptureKeyToken (acc, token) {
  const [currentExpression, fragmentedCaptureExpressionsInfo] = acc
  switch (token.type) {
    case states.capture_expr:
      return [currentExpression ? `${currentExpression} ${token.text}` : token.text, fragmentedCaptureExpressionsInfo]
    case states.capture_expr_sep: {
      return ['', [...fragmentedCaptureExpressionsInfo, { type: 'expression', text: currentExpression }]]
    }
    case states.sq_string:
    case states.dq_string:
    case states.bt_string: {
      /** @type {CaptureExpressionsInfoDetail} */
      const info = { type: 'string', text: token.text.slice(1, token.text.length - 1) }
      return [currentExpression, [...fragmentedCaptureExpressionsInfo, info]]
    }
    default:
      console.error('error: invalid expression, ignoring...')
      return acc
  }
}

/**
 * Parse capture key to ease usage in {@link getFormatterFromTokens}
 * @param {Token} captureToken
 * @returns {CaptureExpressionsInfoDetail[]}
 */
function parseCaptureKey (captureToken) {
  const [currentExpression, fragmentedCaptureExpressionsInfo] = captureToken.childTokens.reduce(parseCaptureKeyToken, ['', []])

  if (currentExpression) {
    fragmentedCaptureExpressionsInfo.push({
      type: 'expression',
      text: currentExpression,
    })
  }

  return fragmentedCaptureExpressionsInfo
}

/**
 * Formatter to use for simple capture expressions (e.g. `{0}`)
 * @type {FormatterReducer}
 */
function applyDefaultformatter (acc) {
  if (acc.defaultFormatters && typeof acc.position === 'number') {
    return {
      ...acc,
      result: acc.defaultFormatters[acc.position](acc.result, acc.locale),
    }
  }
  return acc
}

/**
 *
 * @param {number} position
 * @returns {FormatterReducer}
 */
const positionFormatter = (position) => (acc) => {
  const { parameters } = acc
  if (parameters.length <= position) {
    return {
      ...acc,
      result: '',
      exit: true,
    }
  }
  return {
    ...acc,
    position,
    result: parameters[position],
  }
}

/**
 *
 * @param {FormatterReducer[]} fragmentedFormatters
 * @param {readonly string[]} parameters
 * @param {Intl.Locale} locale
 * @param {readonly DefaultFormatter[]} [defaultFormatters]
 * @returns
 */
const reducerFormatter = (fragmentedFormatters, parameters, locale, defaultFormatters = []) => {
  /** @type {FormatterReducerAcc} */
  let reducerAcc = {
    parameters,
    defaultFormatters,
    result: '',
    locale,
  }
  for (const fragmentedFormatter of fragmentedFormatters) {
    if (reducerAcc.exit) {
      return reducerAcc.result
    }
    reducerAcc = fragmentedFormatter(reducerAcc)
  }
  return reducerAcc.result
}

/**
 * @param {CaptureExpressionsInfoDetail} detail - capture token
 * @returns {FormatterReducer | null}
 */
function getFirstExpressionFormatterReducer (detail) {
  if (detail.type === 'string') {
    const { text } = detail
    return (acc) => ({ ...acc, result: text })
  } else if (isInteger(detail.text)) {
    const position = +detail.text
    return positionFormatter(position)
  } else {
    return null
  }
}

const printNothing = () => ''

/**
 * @param {Token} token - capture token
 * @returns {Formatter}
 */
function getFormatterFromCaptureToken (token) {
  const fragmentedCaptureExpressionsInfo = parseCaptureKey(token)
  if (fragmentedCaptureExpressionsInfo.length === 0) { return printNothing }

  const [firstInfo, ...restInfo] = fragmentedCaptureExpressionsInfo
  const firstReducer = getFirstExpressionFormatterReducer(firstInfo)
  if (!firstReducer) { return printNothing }

  const fragmentedFormatters = [firstReducer]
  for (const info of restInfo) {
    const { text } = info
    if (Object.hasOwn(expressionFormatters, text)) {
      const formatter = expressionFormatters[text]
      fragmentedFormatters.push((acc) => ({ ...acc, result: formatter.format(acc.result, acc.locale) }))
    }
  }
  if (fragmentedFormatters.length <= 1) {
    fragmentedFormatters.push(applyDefaultformatter)
  }

  return (parameters, locale, defaultFormatters) => reducerFormatter(fragmentedFormatters, parameters, locale, defaultFormatters)
}

/**
 *
 * @param {object} param
 * @param {string[]} param.strings
 * @param {Formatter[]} param.formatters
 */
function guaranteeFormatterEndsWithString ({ strings, formatters }) {
  if (strings.length === formatters.length) {
    strings.push('')
  }
  return { strings, formatters }
}

/**
 *
 * @param {Token[]} tokens
 * @returns
 */
function getFormatterFromTokens (tokens) {
  const captureTokens = tokens.filter((token) => token.type === states.capture)

  if (captureTokens.length <= 0) {
    const textToMatch = tokens.map((token) => token.text).join('')
    return formatSimpleKey(textToMatch)
  }

  /** @type {string[]} */
  const strings = []
  /** @type {Formatter[]} */
  const formatters = []

  for (const keyToken of tokens) {
    if (keyToken.type !== states.capture) {
      strings.push(keyToken.text)
      continue
    }
    formatters.push(getFormatterFromCaptureToken(keyToken))
  }

  return formatterWithFormat(guaranteeFormatterEndsWithString({ strings, formatters }))
}

/**
 *
 * @param {AST} ast
 * @returns {TemplateFormatter}
 */
export function getFormatter (ast) {
  return getFormatterFromTokens(ast.tokens)
}

/** @typedef {import('./key-ast.util.js').AST} AST */
/** @typedef {import('./key-ast.util.js').Token} Token */
/** @typedef {import('./capture-expression-values.js').CaptureExpressionInfo} CaptureExpressionInfo */
/** @typedef {import('./capture-expression-values.js').FormatCall} DefaultFormatter */

/**
 * @typedef {object} CaptureExpressionsInfoDetail
 * @property {'expression' | 'string'} type
 * @property {string} text
 */

/**
 * @typedef {object} FormatterReducerAcc
 *
 * Formatter reducer accumulator, used when piping in the result with an expression (e.g. `{0 | relative time}`)
 *
 * @property {readonly string[]} parameters
 *  Parameters used in the i18n key, e.g. when translating "On 2023-01-01T20:00:00 I bought 10 fireworks"
 *  on key "On {date} I bought {number} fireworks", the parameters are going to be ["2023-01-01T20:00:00", "10"]
 * @property {readonly DefaultFormatter[]}  defaultFormatters
 *   The default formatter to use for each parameter in `parameters`
 * @property {string}       result - The current result on accumulator, is the final result after passing all reducers
 * @property {Intl.Locale}  locale - Locale used when formatting the text
 * @property {number}       [position] - index of `parameters` to match text
 * @property {boolean}      [exit] - flag to exit early and use `result` as final result immediately, ignoring the rest of the reducers
 */

/**
 * @typedef {(previous: FormatterReducerAcc) => FormatterReducerAcc} FormatterReducer
 */

/**
 * @typedef {(parameters: readonly string[], locale: Intl.Locale, defaultFormatters?: readonly DefaultFormatter[]) => string} Formatter
 */

/**
 * @typedef {object} TemplateFormatter
 *
 *
 * @property {readonly string[]} strings
 * @property {readonly Formatter[]} formatters
 * @property {(parameters: readonly string[], locale: Intl.Locale, defaultFormatters?: readonly DefaultFormatter[]) => string} format
 */
