import { type AST, getAST, states, type Token } from './key-ast.util.ts'
import { calculatePriority } from './priority-calculator.ts'
import { getMatcher } from './template-matcher.ts'

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

  result.matches = getMatcher(ast)
  result.normalizedKey = getNormalizedKey(ast)
  return result
}

/// matchers
const matchesEquality = (key: string) => (text: string) => text === key

/// types

type ParseResult = {
  /**
   * Defines the key priority.
   * 
   * When finding conflicting keys the one with the hightes priority is choosen
   * 
   * The priority is defined by specificity, the more specific, the highest
   * priority it has.
   * 
   * The specificy is defined by 2 factors:
   * - the lesser number of parameter
   * - the specificity of each parameter
   * 
   * That is what those 2 values means in the priority key, the first value is
   * the number of parameters in the key, and the sum of each parameter specificity value
   */
  priority: [number, number]

  /**
   * `ParseResult.priority` represented value as a number, to simplify comparing keys priorities
   * 
   * @see ParseResult.priority
   */
  priorityAsNumber: number
  key: string
  normalizedKey: string
  matches(text: string): boolean
  ast: AST
}
