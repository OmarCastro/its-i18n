/// states
export enum states {
  normal = 0,
  capture,
  regex,
  sq_string,
  dq_string,
  bt_string,
  escape,

  previous,
}

const ch = (char: string) => char.charCodeAt(0)

const defaultNextState = (() => {
  const state = [] as states[]
  state[states.normal] = states.normal
  state[states.capture] = states.capture
  state[states.regex] = states.regex
  state[states.sq_string] = states.sq_string
  state[states.dq_string] = states.dq_string
  state[states.bt_string] = states.bt_string
  state[states.escape] = states.previous
  state[states.previous] = states.previous
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
  return state
})()

const captureExprState = (() => {
  const state = [] as states[]
  state[ch('\\')] = states.previous
  state[ch('\t')] = states.previous
  state[ch(' ')] = states.previous
  state[ch('\n')] = states.previous
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

const escapeState = [] as states[]

const stateMachine = [] as states[][]
stateMachine[states.normal] = normalState
stateMachine[states.capture] = captureState
stateMachine[states.regex] = regexState
stateMachine[states.sq_string] = singleQuoteStringState
stateMachine[states.dq_string] = doubleQuoteStringState
stateMachine[states.bt_string] = backtickStringState
stateMachine[states.escape] = escapeState

export function getAST(key: string): AST {
  let previousState = states.normal
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
    previousState = currentState
    currentState = newState
    currentMachineState = stateMachine[currentState]
  }

  const length = key.length
  for (let i = 0; i < length; i++) {
    const ch = key.charCodeAt(i)

    const nextState = currentMachineState[ch] ?? defaultNextState[currentState]
    if (nextState == null || nextState === currentState) continue

    if (nextState === states.previous) {
      setCurrentState(previousState)
      if (currentToken.type === states.escape) {
        if (currentToken.parentNode === rootnode) {
          currentToken = rootnode.tokens.pop() as TmpToken
          continue
        }
        currentToken = currentToken.parentNode as TmpToken
        continue
      }

      currentToken.end = i
      if (currentToken.parentNode === rootnode) {
        rootnode.tokens.push(currentToken)
        currentToken = {
          parentNode: rootnode,
          start: i + 1,
          end: i + 1,
          type: states.normal,
          childTokens: [],
        }
        continue
      }
      const parentNode = currentToken.parentNode as TmpToken
      parentNode.childTokens.push(currentToken)
      currentToken = parentNode
      continue
    }
    switch (currentState) {
      case states.normal:
        currentToken.end = i
        if (currentToken.end > currentToken.start) {
          rootnode.tokens.push(currentToken)
        }
        currentToken = {
          parentNode: rootnode,
          start: i + 1,
          end: i + 1,
          type: nextState,
          childTokens: [],
        }
        break
      default: {
        const newToken = {
          parentNode: currentToken,
          start: i + 1,
          end: i + 1,
          type: nextState,
          childTokens: [],
        }
        currentToken = newToken
      }
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
  const mapper = [] as ((Token) => string)[]
  const defaultMapper = (token) => token.text
  mapper[states.normal] = defaultMapper
  mapper[states.capture] = (token) => `{${token.text.trim()}}`
  mapper[states.regex] = defaultMapper
  mapper[states.sq_string] = defaultMapper
  mapper[states.dq_string] = defaultMapper
  mapper[states.bt_string] = defaultMapper
  return mapper
})()

function getNormalizedKey(ast: AST): string {
  return ast.tokens.map((token) => tokenToString[token.type](token)).join('')
}

export function parseKey(key: string) {
  const result = {
    priority: [0, 0, 0],
    key,
  } as ParseResult

  const ast = getAST(key)
  const captures = ast.tokens.filter((token) => token.type === states.capture)

  if (captures.length <= 0) {
    result.priority[0] = 1
    result.matches = matchesEquality(key)
    result.normalizedKey = key
    return result
  }

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
   */
  priority: [number, number, number]
  key: string
  normalizedKey: string
  matches(text: string): boolean
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
