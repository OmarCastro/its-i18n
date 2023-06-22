import { type AST, states, type Token } from './key-ast.util.js'
import { captureExpressions } from './capture-expression-values.ts'

function calculatePriorityFromTokens(tokens: Token[]) {
  const captureTokens = tokens.filter((token) => token.type === states.capture)

  const captureValues = captureTokens.length
  const captureExpressionsInfo = captureTokens.map((captureToken) => {
    const fragmentedCaptureExpressionsInfo = [] as CaptureExpressionsInfo[]
    if (captureToken.childTokens.length === 0) {
      return { value: captureExpressions.special.any.value }
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

    const values = fragmentedCaptureExpressionsInfo.map((captureExpressionsInfo) => {
      switch (captureExpressionsInfo.type) {
        case 'string':
          return captureExpressions.named.string.value
        case 'expression':
          return captureExpressions.named[captureExpressionsInfo.text]?.value ?? 0
        case 'regex':
          return captureExpressions.special.regex.value
      }
    })

    return {
      value: Math.min(...values),
    }
  })

  const sum = captureExpressionsInfo.map(({ value: _ }) => _).reduce((a, b) => a + b, 0)

  const priority = [captureValues, sum] as const
  return {
    priority,
    priorityAsNumber: getNumericValuePriority(priority),
  }
}

export function calculatePriority(ast: AST) {
  return calculatePriorityFromTokens(ast.tokens)
}

export const getNumericValuePriority = ([captureValues, sum]: readonly [number, number]) =>
  Number.MAX_SAFE_INTEGER - (captureValues << 20) + sum

type CaptureExpressionsInfo = {
  type: 'expression' | 'regex' | 'string'
  text: string
}
