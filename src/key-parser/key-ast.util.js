/**
 * Enum for token types.
 * @enum {number}
 */
export const states = {
  normal: 0,
  capture: 1,
  capture_expr: 2,
  capture_expr_sep: 3,
  regex: 4,
  sq_string: 5,
  dq_string: 6,
  bt_string: 7,
  escape: 8,

  previous: 9,
  previous_ignore: 10,
}

/**
 * @param {string} char 
 * @returns {number} the Unicode value of the character
 */
const ch = (char) => char.charCodeAt(0)

const defaultNextState = (() => {
  const state = []
  state[states.normal] = states.normal
  state[states.capture] = states.capture_expr
  state[states.capture_expr] = states.capture_expr
  state[states.capture_expr_sep] = states.previous_ignore
  state[states.regex] = states.regex
  state[states.sq_string] = states.sq_string
  state[states.dq_string] = states.dq_string
  state[states.bt_string] = states.bt_string
  state[states.escape] = states.previous
  return state
})()

const normalState = (() => {
  const state = []
  state[ch('{')] = states.capture
  return state
})()

const captureState = (() => {
  const state = []
  state[ch('}')] = states.previous
  state[ch('/')] = states.regex
  state[ch('\'')] = states.sq_string
  state[ch('"')] = states.dq_string
  state[ch('`')] = states.bt_string
  state[ch('\\')] = states.escape
  state[ch('\t')] = states.capture
  state[ch(' ')] = states.capture
  state[ch('\n')] = states.capture
  state[ch('|')] = states.capture_expr_sep
  return state
})()

const captureExprState = (() => {
  const state = []
  state[ch('\\')] = states.previous_ignore
  state[ch('\t')] = states.previous_ignore
  state[ch(' ')] = states.previous_ignore
  state[ch('|')] = states.previous_ignore
  state[ch('\n')] = states.previous_ignore
  state[ch('}')] = states.previous_ignore
  return state
})()

const regexState = (() => {
  const state = []
  state[ch('/')] = states.previous
  state[ch('\\')] = states.escape
  return state
})()

const singleQuoteStringState = (() => {
  const state = []
  state[ch('\'')] = states.previous
  state[ch('\\')] = states.escape
  return state
})()

const doubleQuoteStringState = (() => {
  const state = []
  state[ch('"')] = states.previous
  state[ch('\\')] = states.escape
  return state
})()

const backtickStringState = (() => {
  const state = []
  state[ch('`')] = states.previous
  state[ch('\\')] = states.escape
  return state
})()

const stateMachine = (() => {
  const state = []
  state[states.normal] = normalState
  state[states.capture] = captureState
  state[states.capture_expr] = captureExprState
  state[states.capture_expr_sep] = []
  state[states.regex] = regexState
  state[states.sq_string] = singleQuoteStringState
  state[states.dq_string] = doubleQuoteStringState
  state[states.bt_string] = backtickStringState
  state[states.escape] = []
  return state
})()


/**
 * Parses the string into an Abstract Syntac Tree (AST)
 * 
 * @param {string} key - target sting
 * @returns {AST} the parsed AST of the target key
 */
export function getAST(key) {
  let currentState = states.normal
  let currentMachineState = stateMachine[currentState]
  const tokens = []
  /** @type {AST_In_Progress} */
  const rootnode = {
    tokens: [],
  }

  /** @type {TmpToken} */
  let currentToken = {
    parentNode: rootnode,
    start: 0,
    end: 0,
    type: states.normal,
    childTokens: [],
  }

  /**
   * Sets the current state
   * @param {number} newState 
   */
  const setCurrentState = (newState) => {
    currentState = newState
    currentMachineState = stateMachine[currentState]
  }

  /**
   * @param {AST_In_Progress | TmpToken} node
   * @returns {node is AST_In_Progress}
   */
  const isRootNode = (node) => node === rootnode


  /**
   * sets the current token the parent node or the
   * @param {number} index 
   */
  const upOneLevel = (index) => {
    setCurrentState(/** @type {TmpToken} */(currentToken.parentNode).type ?? states.normal)



    if (currentToken.type === states.escape) {
      const {parentNode} = currentToken

      if (isRootNode(parentNode)) {
        currentToken = /** @type {TmpToken} */(rootnode.tokens.pop())
        return
      }
      currentToken = parentNode
      return
    }

    currentToken.end = index + 1

    const {parentNode} = currentToken

    if (isRootNode(parentNode)) {
      parentNode.tokens.push(currentToken)
      currentToken = {
        parentNode: parentNode,
        start: index + 1,
        end: index + 1,
        type: states.normal,
        childTokens: [],
      }
      return
    }

    parentNode.childTokens.push(currentToken)
    currentToken = parentNode
    return
  }

  const length = key.length
  for (let i = 0; i < length; i++) {
    const ch = key.charCodeAt(i)

    const nextState = currentMachineState[ch] ?? defaultNextState[currentState]
    if (nextState == null || nextState === currentState) continue

    if (nextState === states.previous) {
      upOneLevel(i)
      continue
    }

    if (nextState === states.previous_ignore) {
      upOneLevel(i - 1)
      i--
      continue
    }

    if (currentState == states.normal) {
      // at this point the next state is always `states.capture`
      if(key.charCodeAt(i + 1) === ch){
        i++
        continue
      }

      currentToken.end = i
      if (currentToken.end > currentToken.start) {
        rootnode.tokens.push(currentToken)
      }
      currentToken = {
        parentNode: rootnode,
        start: i,
        end: i,
        type: nextState,
        childTokens: [],
      }
    } else {
      const newToken = {
        parentNode: currentToken,
        start: i,
        end: i,
        type: nextState,
        childTokens: [],
      }
      currentToken = newToken
    }
    setCurrentState(nextState)
  }
  
  currentToken.end = key.length
  if (currentToken.end > currentToken.start) {
    rootnode.tokens.push(currentToken)
  }

  /** @type {(a: TmpToken) => Token} */
  const toToken  = ({ start, end, type, childTokens }) => {
    const substring = key.substring(start, end)
    const text = type === states.normal ? substring.replaceAll("{{", "{") : substring

    return {
      start,
      end,
      type,
      text,
      childTokens: childTokens.map(toToken),
    }
    
  }

  return {
    key,
    tokens: rootnode.tokens.map(toToken),
  }
}



/**
 * @typedef {object} AST
 * 
 * Abstract syntax tree (AST), or just syntax tree, A parse tree is a visual representation of the
 * syntactic structure of a piece of source code, as produced by a parser.
 * It shows the hierarchy of the elements in the code and the relationships between them.
 * 
 * @property {string} key - the target key used to create the key
 * @property {Token[]} tokens - the direct descentdant of the root tree
 * 
 */

/**
 * @typedef {object} AST_In_Progress
 * 
 * A "work in progress" AST, it is just a object used to build the {@see AST}
 * 
 * @property {TmpToken[]} tokens - the direct descentdant of the root tree
 */


/**
 * @typedef {object} Token
 * Represents a Node in the {@link AST}
 * 
 * @property {number} start - text ocurrent starting position (start index), number is inclusive
 * @property {number} end - text ocurrent ending position (end index), number is exclusive
 * @property {typeof states[keyof typeof states]} type - the node type
 * @property {string} text - substring of the {@link AST.key} with `start` and `end`
 * @property {Token[]} childTokens - direct child tokens of the node
 */


/**
 * @typedef {object} TmpToken
 * Temporary {@link Token}, used to create the final {@link Token}
 * 
 * @property {AST_In_Progress | TmpToken} parentNode - parent node
 * @property {number} start - text ocurrent starting position (start index), number is inclusive
 * @property {number} end - text ocurrent ending position (end index), number is exclusive
 * @property {typeof states[keyof typeof states]} type - the node type
 * @property {TmpToken[]} childTokens - direct child temporary tokens of the node
 */
