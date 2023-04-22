import { type AST, getAST, states, type Token } from './key-ast.util.ts'
import { calculatePriority } from './priority-calculator.ts'

const tokenToString = (() => {
  const mapper = [] as ((token: Token) => string)[]
  const defaultMapper = (token) => token.text
  mapper[states.normal] = defaultMapper
  mapper[states.capture] = (token) => {
    const { childTokens } = token

    if (childTokens.length <= 0) {
      return '{}'
    }
    let normalizedCapture = tokenToString(childTokens[0])
    for (let i = 1, e = childTokens.length; i < e; i++) {
      const previousToken = childTokens[i - 1]
      const token = childTokens[i]
      if (previousToken.type === states.capture_expr && token.type === states.capture_expr) {
        normalizedCapture += ' '
      }
      normalizedCapture += tokenToString(token)
    }
    return `{${normalizedCapture}}`
  }
  const tokenToString = (token: Token) => (mapper[token.type] ?? defaultMapper)(token)
  return tokenToString
})()

function getNormalizedKey(ast: AST): string {
  return ast.tokens.map((token) => tokenToString(token)).join('')
}

export function parseKey(key: string) {
  const ast = getAST(key)
  const { priority, priorityAsNumber } = calculatePriority(ast)
  const captures = ast.tokens.filter((token) => token.type === states.capture)

  const result = {
    priority,
    priorityAsNumber,
    key,
    ast,
  } as ParseResult

  if (captures.length <= 0) {
    result.matches = matchesEquality(key)
    result.normalizedKey = key
    return result
  }

  result.matches = matchesEquality(key)
  result.normalizedKey = getNormalizedKey(ast)
  return result
}

/// matchers
const matchesEquality = (key: string) => (text: string) => text === key

/// types

type ParseResult = {
  /**
   * Defined the priority of parsing
   * first number is either 1 when it is exact match (there is no capture group), 0 otherwise
   * second number is the number of capture groups.
   * third number is the sum of capture group values
   */
  priority: [number, number]
  priorityAsNumber: number
  key: string
  normalizedKey: string
  matches(text: string): boolean
  ast: AST
}
