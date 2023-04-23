import { type AST, states, type Token } from './key-ast.util.ts'
import { escape } from '../utils/algorithms/regex.utils.ts'
import { captureExpressions } from './capture-expression-values.ts'

const falsePredicate = (text: string) => false
const truePredicate = (text: string) => false

function getMatcherFromTokens(tokens: Token[]) {
  const captureTokens = tokens.filter((token) => token.type === states.capture)

  const captureExpressionsInfo = captureTokens.map((captureToken) => {
    const fragmentedCaptureExpressionsInfo = [] as CaptureExpressionsInfo[]
    if (captureToken.childTokens.length === 0) {
      return { matchPredicate: truePredicate }
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
      matchPredicate: (text: string) => predicates.some((predicate) => predicate(text)),
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
    if (typeof text !== 'string') return false
    regex ??= new RegExp('^' + regexStr + '$')
    const matches = text.match(regex)
    if (matches == null) {
      return false
    }
    return matches.slice(1).every((text, index) => captureExpressionsInfo[index].matchPredicate(text))
  }
}

export function getMatcher(ast) {
  return getMatcherFromTokens(ast.tokens)
}

type CaptureExpressionsInfo = {
  type: 'expression' | 'regex' | 'string'
  text: string
}
