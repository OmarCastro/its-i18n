import { getAST, states } from './key-ast.util.js'
import { calculatePriority } from './priority-calculator.js'
import { getMatcher } from './template-matcher.js'

/** @param {Token} token - parsed key AST */
function normalizeDefaultToken (token) {
  return token.text
}

/**
 * @param {Token} token - parsed key AST
 * @returns {string}
 */
function normalizedCaptureToken (token) {
  const { childTokens } = token

  if (childTokens.length <= 0) {
    return '{}'
  }
  let normalizedCapture = normalizeToken(childTokens[0])
  for (let i = 1, e = childTokens.length; i < e; i++) {
    const previousToken = childTokens[i - 1]
    const token = childTokens[i]
    if (previousToken.type === states.capture_expr && token.type === states.capture_expr) {
      normalizedCapture += ' '
    }
    normalizedCapture += normalizeToken(token)
  }
  return `{${normalizedCapture}}`
}

const normalizeTokenMapper = {
  [states.capture]: normalizedCaptureToken,
  [states.normal]: normalizeDefaultToken,
}

/**
 * Uses the target abstract syntax tree token to normalize the key
 * @param {Token} token - parsed key AST
 */
function normalizeToken (token) {
  return (normalizeTokenMapper[token.type] ?? normalizeDefaultToken)(token)
}

/**
 * Uses the abstract syntax tree to normalize the key
 * @param {AST} ast - parsed key AST
 */
function getNormalizedKey (ast) {
  return ast.tokens.map(normalizeToken).join('')
}

/**
 * Parses i18n key
 *
 * @param {string} key - target key to parse
 * @returns {ParseResult} - parse result
 */
export function parseKey (key) {
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
 * @typedef {object} ParseResult
 *
 * Representes the result of parsing a defined key
 *
 * @property {[number, number]} priority
 *   Defines the key priority.
 *
 *   When finding conflicting keys the one with the hightes priority is choosen
 *
 *   The priority is defined by specificity, the more specific, the highest
 *   priority it has.
 *
 *   The specificy is defined by 2 factors:
 *   - the lesser number of parameter
 *   - the specificity of each parameter
 *
 *   That is what those 2 values means in the priority key, the first value is
 *   the number of parameters in the key, and the sum of each parameter specificity value
 * @property {number} priorityAsNumber
 *   `ParseResult.priority` represented value as a number, to simplify comparing keys priorities, see {@link ParseResult.priority}
 * @property {string} key - target key used to parse
 * @property {string} normalizedKey - normalized target key used to parse
 * @property {MatchPredicate} matches - Predicate to check if a defined text matches the key
 * @property {ReturnType<typeof getMatcher>} match - matcher of target key
 * @property {AST} ast - Abstract syntax tree generated as result from parsing the key
 */

/**
 * @callback MatchPredicate
 *
 * Predicate to check if a defined text matches the key
 *
 * @param {string} text - target text to parse
 * @returns {boolean}
 */

/** @typedef {import('./key-ast.util.js').Token} Token */
/** @typedef {import('./key-ast.util.js').AST} AST */
