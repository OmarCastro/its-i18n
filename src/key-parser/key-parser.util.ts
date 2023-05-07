import { type AST, getAST, states, type Token } from './key-ast.util.ts'
import { calculatePriority } from './priority-calculator.ts'
import { getMatcher } from './template-matcher.ts'

/**
 * Uses the target abstract syntax tree token to normalize the key
 */
const normalizeToken = (() => {
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

/**
 * Uses the abstract syntax tree to normalize the key
 */
function getNormalizedKey(ast: AST): string {
  return ast.tokens.map((token) => normalizeToken(token)).join('')
}

/**
 * Parses i18n key
 *
 * @param key - target key to parse
 * @returns {ParseResult} - parse result
 */
export function parseKey(key: string) {
  const ast = getAST(key)
  const { priority, priorityAsNumber } = calculatePriority(ast)
  const match = getMatcher(ast)
  const normalizedKey = getNormalizedKey(ast)

  return {
    priority,
    priorityAsNumber,
    key,
    ast,
    match,
    normalizedKey,
    matches: (text) => match(text).isMatch,
  }
}

/// types

/**
 * Representes the result of parsing a defined key
 */
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

  /**
   * target key used to parse
   */
  key: string

  /**
   * normalized target key used to parse
   */
  normalizedKey: string

  /**
   * Predicate to check if a defined text matches the key
   * @param text - target text to parse
   */
  matches(text: string): boolean

  match: ReturnType<typeof getMatcher>

  /**
   * Abstract syntax tree generated as result from parsing the key
   */
  ast: AST
}
