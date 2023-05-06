import { type AST, getAST, states, type Token } from './key-ast.util.ts'

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

function getNormalizedValue(ast: AST): string {
  return ast.tokens.map((token) => tokenToString(token)).join('')
}

export function parseValue(value: string) {
  const ast = getAST(value)
  const captures = ast.tokens.filter((token) => token.type === states.capture)

  const result = {
    value,
    ast,
  } as ParseResult

  if (captures.length <= 0) {
    result.format = formatSimpleKey(value)
    result.normalizedValue = value
    return result
  }

  result.format = formatSimpleKey(value)
  result.normalizedValue = getNormalizedValue(ast)
  return result
}

/// formatters
const formatSimpleKey = (key: string) => () => key

/// types

type ParseResult = {
  value: string
  normalizedValue: string
  /**
   * @param parameters - parameters apply on format
   */
  format(parameters: string[]): string
  ast: AST
}
