/**
 * @file responsible of calculating key priority in key
 */

import { states } from './key-ast.util.js'
import { captureExpressions } from './capture-expression-values.js'

/**
 * @param {import('./key-ast.util.js').AST} ast
 * @returns
 */
export function calculatePriority (ast) {
  return calculatePriorityFromTokens(ast.tokens)
}

/**
 * @param {import('./key-ast.util.js').Token[]} tokens
 * @returns {KeyPriority}
 */
function calculatePriorityFromTokens (tokens) {
  const captureTokens = tokens.filter((token) => token.type === states.capture)
  const captureValues = captureTokens.length
  const captureExpressionsInfo = captureTokens.map(calculateCaptureTokenPriority)
  const sum = captureExpressionsInfo.reduce((a, b) => a + b, 0)
  return {
    priority: [captureValues, sum],
    priorityAsNumber: getNumericValuePriority(captureValues, sum),
  }
}

/**
 * Calculates the priority of a value token
 * @param {import('./key-ast.util.js').Token} captureToken
 * @returns
 */
function calculateCaptureTokenPriority (captureToken) {
  if (captureToken.childTokens.length === 0) {
    return captureExpressions.special.any.value
  }

  let value = Number.MAX_SAFE_INTEGER
  let currentExpression = ''
  for (const token of captureToken.childTokens) {
    switch (token.type) {
      case states.capture_expr:
        currentExpression = currentExpression ? `${currentExpression} ${token.text}` : token.text
        continue
      case states.capture_expr_sep:
        value = Math.min(value, captureExpressions.named[currentExpression]?.value ?? 0)
        currentExpression = ''
        continue
      case states.regex:
        value = Math.min(value, captureExpressions.special.regex.value)
        continue
      case states.sq_string:
      case states.dq_string:
      case states.bt_string:
        value = Math.min(value, captureExpressions.named.string.value)
        continue
    }
  }

  if (currentExpression) {
    value = Math.min(value, captureExpressions.named[currentExpression]?.value ?? 0)
  }

  return value
}

/**
 * Calculates the priority into a numeric value to ease comparison of keys priority
 *
 * @param {number} captures - first value of priority - the number of capture tokens
 * @param {number} sum      - second value of priority - the sum of capture token values
 * @returns the numeric representation of priority tuple
 */
export const getNumericValuePriority = (captures, sum) => Number.MAX_SAFE_INTEGER - (captures << 20) + sum

/**
 * @typedef {object} KeyPriority
 *
 * @property {[number, number]} priority
 * @property {number} priorityAsNumber
 *
 */
