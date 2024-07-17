import { states } from './key-ast.util.js'
import { formatters as expressionFormatters } from './expression-formatters.js'
import { isInteger } from '../utils/algorithms/number.utils.js'
/** @import {AST, Token} from './key-ast.util.js' */
/** @import {CaptureExpressionInfo, FormatCall as DefaultFormatter} from './capture-expression-values.js' */

/** @type { Readonly<never[]>} */
const emptyArray = Object.freeze([])

/**
 * Add or replace format method from templateFormatter object
 * @param {Omit<TemplateFormatter, 'format'>} templateFormatter - target TemplateFormatter object
 * @returns {TemplateFormatter} TemplateFormatter object with updated `format` fuction
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
 * @param {string} value - value contant
 * @returns {TemplateFormatter} resulting template formatter
 */
const formatSimpleKey = (value) => ({
  strings: [value],
  formatters: emptyArray,
  format: () => value,
})

/**
 * parse capture key token reducer
 * @param {[string, CaptureExpressionsInfoDetail[]]} acc - accumulator
 * @param {Token} token - capture child token
 * @returns {[string, CaptureExpressionsInfoDetail[]]} updated accumulator
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
 * @param {Token} captureToken - target capture token
 * @returns {CaptureExpressionsInfoDetail[]} parse result
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
 * @param {number} position - position to query
 * @returns {FormatterReducer} built FormatterReducer
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
 * @param {FormatterReducer[]} fragmentedFormatters - list of formatter reducers
 * @param {Strings} parameters - parameter list
 * @param {Intl.Locale} locale - locale to format data
 * @param {DefaultFormatters} [defaultFormatters] - default formatter
 * @returns {string} format result
 */
const formatFromReducers = (fragmentedFormatters, parameters, locale, defaultFormatters = []) => {
  /** @type {FormatterReducerAccumulator} */
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
 * @returns {FormatterReducer | null} - FormatterReducer or null if invalid
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
 * @returns {Formatter} resulting formatter
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

  return (parameters, locale, defaultFormatters) => formatFromReducers(fragmentedFormatters, parameters, locale, defaultFormatters)
}

/**
 * This is for the formatter to work the same way as a template string, it always end with a string even if is empty
 * @param {Pick<TemplateFormatter, "strings"|"formatters">} params - building formatter
 * @returns {Pick<TemplateFormatter, "strings"|"formatters">} formatter that ends with string
 */
function guaranteeFormatterEndsWithString (params) {
  const { strings, formatters } = params
  if (strings.length === formatters.length) {
    return { strings: [...strings, ''], formatters }
  }
  return params
}

/**
 * @param {AST} ast  - AST of parsed value
 * @returns {TemplateFormatter} resulting formatter
 */
export function getFormatter (ast) {
  const { tokens } = ast
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
 * @typedef {object} CaptureExpressionsInfoDetail
 * @property {'expression' | 'string'} type - type of detail
 * @property {string} text - detail text
 */

/**
 * @typedef {object} FormatterReducerAccumulator
 *
 * Formatter reducer accumulator, used when piping in the result with an expression (e.g. `{0 | relative time}`)
 * @property {Strings} parameters
 *  Parameters used in the i18n key, e.g. when translating "On 2023-01-01T20:00:00 I bought 10 fireworks"
 *  on key "On {date} I bought {number} fireworks", the parameters are going to be ["2023-01-01T20:00:00", "10"]
 * @property {DefaultFormatters}  defaultFormatters
 *   The default formatter to use for each parameter in `parameters`
 * @property {string}       result - The current result on accumulator, is the final result after passing all reducers
 * @property {Intl.Locale}  locale - Locale used when formatting the text
 * @property {number}       [position] - index of `parameters` to match text
 * @property {boolean}      [exit] - flag to exit early and use `result` as final result immediately, ignoring the rest of the reducers
 */

/**
 * @callback FormatterReducer
 * @param {FormatterReducerAccumulator} previous - reducer previous value
 * @returns {FormatterReducerAccumulator} next value
 */

/**
 * @callback Formatter
 *  A placeholder formatter
 * @param {Strings} parameters -
 *     Placeholder parameters, the placeholder may be empty ({}), may contain one parameter that is a string ({"text"}) or a capture expression position ({ 0 })
 * additional parameters allows to define how to convert the previous parameter result ({0 | relative time})
 * @param {Intl.Locale} locale - locale to format
 * @param {DefaultFormatters} [defaultFormatters] - default formatter
 * @returns {string} formatted string
 */

/**
 * @typedef {object} TemplateFormatter
 * @property {Strings} strings - raw strings
 * @property {Formatters} formatters - formatters of each capture token
 * @property {(parameters: Strings, locale: Intl.Locale, defaultFormatters?: DefaultFormatters) => string} format - format function
 */

/** @typedef {Readonly<string[]>} Strings - raw string array, immutable */
/** @typedef {Readonly<Formatter[]>} Formatters - formatters of each capture token */
/** @typedef {Readonly<DefaultFormatter[]>} DefaultFormatters - default formatters of each capture token */
