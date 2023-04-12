/// states
export enum states {
  normal = 0,
  capture,
  capture_expr,
  capture_expr_sep,
  regex,
  sq_string,
  dq_string,
  bt_string,
  escape,

  previous,
  previous_ignore,
}

const ch = (char: string) => char.charCodeAt(0)

const defaultNextState = (() => {
  const state = [] as states[]
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
  const state = [] as states[]
  state[ch('{')] = states.capture
  state[ch('\\')] = states.escape
  return state
})()

const captureState = (() => {
  const state = [] as states[]
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
  const state = [] as states[]
  state[ch('\\')] = states.previous_ignore
  state[ch('\t')] = states.previous_ignore
  state[ch(' ')] = states.previous_ignore
  state[ch('\n')] = states.previous_ignore
  state[ch('}')] = states.previous_ignore
  return state
})()

const regexState = (() => {
  const state = [] as states[]
  state[ch('/')] = states.previous
  state[ch('\\')] = states.escape
  return state
})()

const singleQuoteStringState = (() => {
  const state = [] as states[]
  state[ch('\'')] = states.previous
  state[ch('\\')] = states.escape
  return state
})()

const doubleQuoteStringState = (() => {
  const state = [] as states[]
  state[ch('"')] = states.previous
  state[ch('\\')] = states.escape
  return state
})()

const backtickStringState = (() => {
  const state = [] as states[]
  state[ch('`')] = states.previous
  state[ch('\\')] = states.escape
  return state
})()

const emptyState = [] as states[]

const stateMachine = [] as states[][]
stateMachine[states.normal] = normalState
stateMachine[states.capture] = captureState
stateMachine[states.capture_expr] = captureExprState
stateMachine[states.capture_expr_sep] = emptyState
stateMachine[states.regex] = regexState
stateMachine[states.sq_string] = singleQuoteStringState
stateMachine[states.dq_string] = doubleQuoteStringState
stateMachine[states.bt_string] = backtickStringState
stateMachine[states.escape] = emptyState

export function getAST(key: string): AST {
  let currentState = states.normal
  let currentMachineState = stateMachine[currentState]
  const tokens = []
  const rootnode = {
    tokens: [],
  } as TmpAST
  let currentToken = {
    parentNode: rootnode,
    start: 0,
    end: 0,
    type: states.normal,
    childTokens: [],
  } as TmpToken

  const setCurrentState = (newState: states) => {
    currentState = newState
    currentMachineState = stateMachine[currentState]
  }

  const upOneLevel = (index) => {
    setCurrentState((currentToken.parentNode as TmpToken).type ?? states.normal)
    if (currentToken.type === states.escape) {
      if (currentToken.parentNode === rootnode) {
        currentToken = rootnode.tokens.pop() as TmpToken
        return
      }
      currentToken = currentToken.parentNode as TmpToken
      return
    }

    currentToken.end = index + 1
    if (currentToken.parentNode === rootnode) {
      rootnode.tokens.push(currentToken)
      currentToken = {
        parentNode: rootnode,
        start: index + 1,
        end: index + 1,
        type: states.normal,
        childTokens: [],
      }
      return
    }
    const parentNode = currentToken.parentNode as TmpToken
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
  const toToken: (a: TmpToken) => Token = (
    { start, end, type, childTokens }: TmpToken,
  ) => ({
    start,
    end,
    type,
    text: key.substring(start, end),
    childTokens: childTokens.map(toToken),
  })

  return {
    key,
    tokens: rootnode.tokens.map(toToken),
  }
}

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
  const result = {
    priority: [0, 0, 0],
    key,
  } as ParseResult

  const ast = getAST(key)
  const captures = ast.tokens.filter((token) => token.type === states.capture)
  result.ast = ast

  if (captures.length <= 0) {
    result.priority[0] = 1
    result.matches = matchesEquality(key)
    result.normalizedKey = key
    return result
  }

  result.priority[1] = captures.length
  result.priority[2] = 1
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
  priority: [number, number, number]
  key: string
  normalizedKey: string
  matches(text: string): boolean
  ast: AST
}

type TmpAST = {
  tokens: TmpToken[]
}

type AST = {
  key: string
  tokens: Token[]
}

type TmpToken = {
  parentNode: TmpAST | TmpToken
  start: number
  end: number
  type: states
  childTokens: TmpToken[]
}

type Token = {
  start: number
  end: number
  type: states
  text: string
  childTokens: Token[]
}
