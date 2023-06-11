import { type AST, states, type Token } from './key-ast.util.ts'
import { escape } from '../utils/algorithms/regex.utils.js'
import { type CaptureExpressionInfo, captureExpressions } from './capture-expression-values.ts'

const falsePredicate = () => false
const emptyArray = Object.freeze([])

const anyMatchExpression = Object.freeze({
  isMatch: true,
  expressionInfo: captureExpressions.special.any,
}) as ParameterMatchResult

const noMatchExpression = Object.freeze({
  isMatch: false,
})

const anyMatchCaptureExpressionsInfo = {
  matchPredicate: () => anyMatchExpression,
}

const noMatch = Object.freeze({
  isMatch: false,
  parameters: emptyArray,
  defaultFormatters: emptyArray,
}) as MatchResult

const emptyYesMatch = Object.freeze({
  isMatch: true,
  parameters: emptyArray,
  defaultFormatters: emptyArray,
}) as MatchResult

const exactStringMatcher = (textToMatch: string) => (text: string) => (textToMatch === text) ? emptyYesMatch : noMatch

function getMatcherFromTokens(tokens: Token[]) {
  const captureTokens = tokens.filter((token) => token.type === states.capture)

  if (captureTokens.length <= 0) {
    const textToMatch = tokens.map((token) => token.text).join('')
    return exactStringMatcher(textToMatch)
  }

  const captureExpressionsInfo = captureTokens.map((captureToken) => {
    const fragmentedCaptureExpressionsInfo = [] as CaptureExpressionsInfoDetail[]
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
      matchPredicate: (text: string): ParameterMatchResult => {
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

  return (text: string) => {
    if (typeof text !== 'string') return noMatch
    const matches = text.match(regex)
    if (matches == null) {
      return noMatch
    }

    const parameters = matches.slice(1)
    const paramMatchInfo = [] as CaptureExpressionInfo[]

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
    } as MatchResult
  }
}

export function getMatcher(ast) {
  return getMatcherFromTokens(ast.tokens)
}

type CaptureExpressionsInfoDetail = {
  type: 'expression' | 'regex' | 'string' | 'any'
  text: string
  expressionInfo: CaptureExpressionInfo
  matches(text: string): boolean
}

type Formatter = (text: string, locale: Intl.Locale) => string

type ParameterMatchResult = Readonly<
  { isMatch: false } | {
    isMatch: true
    expressionInfo: CaptureExpressionInfo
  }
>

type MatchResult = {
  isMatch: boolean
  parameters: readonly string[]
  defaultFormatters: readonly Formatter[]
}
