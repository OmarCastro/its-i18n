import { states } from './key-ast.util.js'
import { escape } from '../utils/algorithms/regex.utils.js'
import { captureExpressions } from './capture-expression-values.js'

const falsePredicate = () => false
/** @type {readonly []} */
const emptyArray = Object.freeze([])

/** @type {ParameterMatchResult} */
const anyMatchExpression = Object.freeze({
  isMatch: true,
  expressionInfo: captureExpressions.special.any,
})

const noMatchExpression = Object.freeze({
  isMatch: false,
})

const anyMatchCaptureExpressionsInfo = {
  matchPredicate: () => anyMatchExpression,
}

/** @type {MatchResult} */
const noMatch = Object.freeze({
  isMatch: false,
  parameters: emptyArray,
  defaultFormatters: emptyArray,
})

/** @type {MatchResult} */
const emptyYesMatch = Object.freeze({
  isMatch: true,
  parameters: emptyArray,
  defaultFormatters: emptyArray,
})

/**
 * @param {string} textToMatch
 * @returns {Matcher}
 */
const exactStringMatcher = (textToMatch) => (text) => (textToMatch === text) ? emptyYesMatch : noMatch

/**
 *
 * @param {import('./key-ast.util.js').Token[]} tokens
 * @returns {Matcher}
 */
function getMatcherFromTokens (tokens) {
  const captureTokens = tokens.filter((token) => token.type === states.capture)

  if (captureTokens.length <= 0) {
    const textToMatch = tokens.map((token) => token.text).join('')
    return exactStringMatcher(textToMatch)
  }

  const captureExpressionsInfo = captureTokens.map((captureToken) => {
    /** @type {CaptureExpressionsInfoDetail[]} */
    const fragmentedCaptureExpressionsInfo = []
    if (captureToken.childTokens.length === 0) {
      return anyMatchCaptureExpressionsInfo
    }
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
            expressionInfo: captureExpressions.named[currentExpression],
            matches: captureExpressions.named[currentExpression]?.matchPredicate() ?? falsePredicate,
          })
          currentExpression = ''
          continue
        case states.regex:
          fragmentedCaptureExpressionsInfo.push({
            type: 'regex',
            text: token.text,
            expressionInfo: captureExpressions.special.regex,
            matches: captureExpressions.special.regex.matchPredicate(token.text.slice(1, -1)),
          })
          continue
        case states.sq_string:
        case states.dq_string:
        case states.bt_string:
          fragmentedCaptureExpressionsInfo.push({
            type: 'string',
            text: token.text,
            expressionInfo: captureExpressions.special.string,
            matches: captureExpressions.special.string.matchPredicate(token.text),
          })
          continue
      }
    }
    if (currentExpression) {
      fragmentedCaptureExpressionsInfo.push({
        type: 'expression',
        text: currentExpression,
        expressionInfo: captureExpressions.named[currentExpression],
        matches: captureExpressions.named[currentExpression]?.matchPredicate() ?? falsePredicate,
      })
    }

    return {
      /**
       *
       * @param {string} text
       * @returns {ParameterMatchResult}
       */
      matchPredicate: (text) => {
        const expressionPart = fragmentedCaptureExpressionsInfo.find((expressionPart) => expressionPart.matches(text))
        if (!expressionPart) {
          return noMatchExpression
        }
        return {
          isMatch: true,
          expressionInfo: expressionPart.expressionInfo,
        }
      },
    }
  })

  const regexStr = tokens.map((token) => {
    if (token.type === states.capture) {
      return '(.*)'
    } else {
      return escape(token.text)
    }
  }).join('')

  const regex = new RegExp('^' + regexStr + '$')

  return (text) => {
    if (typeof text !== 'string') return noMatch
    const matches = text.match(regex)
    if (matches == null) {
      return noMatch
    }

    const parameters = matches.slice(1)
    const paramMatchInfo = []

    for (const [index, text] of parameters.entries()) {
      const matchResult = captureExpressionsInfo[index].matchPredicate(text)
      if (!matchResult.isMatch) {
        return noMatch
      }
      paramMatchInfo.push(matchResult.expressionInfo)
    }

    const defaultFormatters = paramMatchInfo.map((info) => info.defaultFormat)

    return {
      isMatch: true,
      parameters,
      defaultFormatters,
    }
  }
}

/**
 *
 * @param {import('./key-ast.util.js').AST} ast
 * @returns {Matcher}
 */
export function getMatcher (ast) {
  return getMatcherFromTokens(ast.tokens)
}

/**
 * @typedef {object} CaptureExpressionsInfoDetail
 * @property {'expression' | 'regex' | 'string' | 'any'} type
 * @property {string} text
 * @property {import('./capture-expression-values.js').CaptureExpressionInfo} expressionInfo
 * @property {(text: string) => boolean} matches
 */

/**
 * @typedef {(text: string, locale: Intl.Locale) => string} Formatter
 */

/**
 * @typedef {Readonly<{ isMatch: false } | {isMatch: true, expressionInfo: import('./capture-expression-values.js').CaptureExpressionInfo}>} ParameterMatchResult
 */

/**
 * @typedef {(text: string) => MatchResult} Matcher
 */

/**
 * @typedef {object} MatchResult
 * @property {boolean} isMatch
 * @property {readonly string[]} parameters
 * @property {readonly Formatter[]} defaultFormatters
 */
