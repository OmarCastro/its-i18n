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
 * Parse capture key to ease usage in {@link getFormatterFromTokens}
 * @param {Token} captureToken
 * @returns {CaptureExpressionsInfoDetail[]}
 */
function parseCaptureKey (captureToken) {
  /** @type {CaptureExpressionsInfoDetail[]} */
  const fragmentedCaptureExpressionsInfo = []

  let currentExpression = ''
  for (const token of captureToken.childTokens) {
    switch (token.type) {
      case states.capture_expr:
        currentExpression = currentExpression ? `${currentExpression} ${token.text}` : token.text
        continue

      case states.capture_expr_sep:
        fragmentedCaptureExpressionsInfo.push({
          type: 'expression',
          text: currentExpression,
        })
        currentExpression = ''
        continue
      case states.sq_string:
      case states.dq_string:
      case states.bt_string:
        fragmentedCaptureExpressionsInfo.push({
          type: 'string',
          text: token.text.slice(1, token.text.length - 1),
        })
        continue
      default:
        console.error('error: invalid expression, ignoring...')
    }
  }
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
    const fragmentedCaptureExpressionsInfo = parseCaptureKey(keyToken)

    if (fragmentedCaptureExpressionsInfo.length === 0) {
      formatters.push(() => '')
      continue
    }

    /** @type {FormatterReducer[]} */
    const fragmentedFormatters = []

    const [firstInfo, ...restInfo] = fragmentedCaptureExpressionsInfo

    if (firstInfo.type === 'string') {
      const { text } = firstInfo
      fragmentedFormatters.push((acc) => ({ ...acc, result: text }))
    } else if (isInteger(firstInfo.text)) {
      const position = +firstInfo.text
      fragmentedFormatters.push(positionFormatter(position))
    } else {
      formatters.push(() => '')
      continue
    }

    for (const info of restInfo) {
      const { text } = info
      if (Object.hasOwn(expressionFormatters, text)) {
        const formatter = expressionFormatters[text]
        fragmentedFormatters.push((acc) => ({
          ...acc,
          result: formatter.format(acc.result, acc.locale),
        }))
      }
    }

    if (fragmentedFormatters.length <= 1) {
      fragmentedFormatters.push(applyDefaultformatter)
    }

    formatters.push((parameters, locale, defaultFormatters) => reducerFormatter(fragmentedFormatters, parameters, locale, defaultFormatters))
  }

  /*
    template strings format works the same way, starts with a string and ends with a string, even
    if it ends with a parameter
  */
  if (strings.length === formatters.length) {
    strings.push('')
  }

  return formatterWithFormat({ strings, formatters })
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
