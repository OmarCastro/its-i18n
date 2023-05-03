import { type AST, states, type Token } from './key-ast.util.ts'
import { escape } from '../utils/algorithms/regex.utils.ts'
import { captureExpressions } from './capture-expression-values.ts'

const falsePredicate = (text: string) => false
const emptyArray = Object.freeze([])
const asIsFormatter = (text: string) => text

const anyMatchExpression = Object.freeze({
  isMatch: true,
  expressionInfo: Object.freeze({
    text: '',
    type: 'any',
  }),
}) as ParameterMatchResult

const noMatchExpression = Object.freeze({
  isMatch: false,
})

const anyMatchCaptureExpressionsInfo = {
  matchPredicate: (text: string) => anyMatchExpression,
}

const noMatch = Object.freeze({
  isMatch: false,
  parameters: emptyArray,
  defaultFormatters: emptyArray,
}) as MatchResult

function getMatcherFromTokens(tokens: Token[]) {
  const captureTokens = tokens.filter((token) => token.type === states.capture)

  const captureExpressionsInfo = captureTokens.map((captureToken) => {
    const fragmentedCaptureExpressionsInfo = [] as CaptureExpressionsInfo[]
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
          })
          currentExpression = ''
          continue
        case states.regex:
          fragmentedCaptureExpressionsInfo.push({
            type: 'regex',
            text: token.text,
          })
          continue
        case states.sq_string:
        case states.dq_string:
        case states.bt_string:
          fragmentedCaptureExpressionsInfo.push({
            type: 'string',
            text: token.text,
          })
          continue
      }
    }
    if (currentExpression) {
      fragmentedCaptureExpressionsInfo.push({
        type: 'expression',
        text: currentExpression,
      })
    }

    const predicates = fragmentedCaptureExpressionsInfo.map((captureExpressionsInfo) => {
      switch (captureExpressionsInfo.type) {
        case 'string':
          return captureExpressions.named.string.matchPredicate()
        case 'expression':
          return captureExpressions.named[captureExpressionsInfo.text]?.matchPredicate() ?? falsePredicate
        case 'regex':
          return captureExpressions.special.regex.matchPredicate(captureExpressionsInfo.text)
        default:
          return falsePredicate
      }
    }) as ((text: string) => boolean)[]

    return {
      matchPredicate: (text: string): ParameterMatchResult => {
        const index = predicates.findIndex((predicate) => predicate(text))
        if (index < 0) {
          return noMatchExpression
        }
        return {
          isMatch: true,
          expressionInfo: fragmentedCaptureExpressionsInfo[index],
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

  let regex: RegExp

  return (text: string) => {
    if (typeof text !== 'string') return noMatch
    regex ??= new RegExp('^' + regexStr + '$')
    const matches = text.match(regex)
    if (matches == null) {
      return noMatch
    }

    const parameters = matches.slice(1)
    const paramMatch = [] as CaptureExpressionsInfo[]

    for (const [index, text] of matches.slice(1).entries()) {
      const matchResult = captureExpressionsInfo[index].matchPredicate(text)
      if (!matchResult.isMatch) {
        return noMatch
      }
      paramMatch.push(matchResult.expressionInfo)
    }

    return {
      isMatch: true,
      parameters,
      defaultFormatters: parameters.map(() => asIsFormatter),
    } as MatchResult
  }
}

export function getMatcher(ast) {
  return getMatcherFromTokens(ast.tokens)
}

type CaptureExpressionsInfo = {
  type: 'expression' | 'regex' | 'string' | 'any'
  text: string
}

type Formatter = (text: string) => string

type ParameterMatchResult = Readonly<
  { isMatch: false } | {
    isMatch: true
    expressionInfo: CaptureExpressionsInfo
  }
>

type MatchResult = {
  isMatch: boolean
  parameters: readonly string[]
  defaultFormatters: readonly Formatter[]
}
