import { states, type Token } from './key-ast.util.ts'
import { captureExpressions } from './capture-expression-values.ts'

function calculatePriority(captureTokens: Token[]) {
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

        case states.sq_string:
        case states.dq_string:
        case states.bt_string:
          fragmentedCaptureExpressionsInfo.push({
            type: 'string',
            text: token.text,
          })
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
          return captureExpressions.named[captureExpressionsInfo.type]?.value ?? 0
        case 'regex':
          captureExpressions.special.regex.value
      }
    })

    return {
      value: Math.min(...values),
    }
  })

  const sum = captureExpressionsInfo.map(({ value: _ }) => _).reduce((a, b) => a + b, 0)

  return {
    array: [captureValues, sum],
    prioriyValue: Number.MAX_SAFE_INTEGER - (captureValues << 20) + sum,
  }
}

type CaptureExpressionsInfo = {
  type: 'expression' | 'regex' | 'string'
  text: string
}
