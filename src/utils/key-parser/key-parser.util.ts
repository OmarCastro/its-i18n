
/// states
export enum states {
    normal = 0,
    capture,
    regex,
    sq_string,
    dq_string,
    bt_string,
    escape,
    
    previous
}

const ch = (char:string) => char.charCodeAt(0)
const normalState = [] as states[]
normalState[ch("{")] = states.capture
normalState[ch("\\")] = states.escape

const captureState = [] as states[]
captureState[ch("}")] = states.previous
captureState[ch("/")] = states.regex
captureState[ch("'")] = states.sq_string
captureState[ch('"')] = states.dq_string
captureState[ch("`")] = states.bt_string
captureState[ch("\\")] = states.escape

const regexState = [] as states[]
regexState[ch("/")] = states.previous
regexState[ch("\\")] = states.escape

const singleQuoteStringState = [] as states[]
singleQuoteStringState[ch("'")] = states.previous
singleQuoteStringState[ch("\\")] = states.escape

const doubleQuoteStringState = [] as states[]
doubleQuoteStringState[ch('"')] = states.previous
doubleQuoteStringState[ch("\\")] = states.escape

const backtickStringState = [] as states[]
backtickStringState[ch("`")] = states.previous
backtickStringState[ch("\\")] = states.escape


const escapeState = new Proxy([], {get: () => states.previous}) as states[]

const stateMachine = [] as states[][]
stateMachine[states.normal] = normalState
stateMachine[states.capture] = captureState
stateMachine[states.regex] = regexState
stateMachine[states.sq_string] = singleQuoteStringState
stateMachine[states.dq_string] = doubleQuoteStringState
stateMachine[states.bt_string] = backtickStringState
stateMachine[states.capture] = captureState


export function getAST(key: string): AST{
    let previousState = states.normal
    let currentState = states.normal;
    let currentMachineState = stateMachine[currentState];
    const tokens = [];
    const rootnode = {
        tokens: []
    } as TmpAST
    let currentToken = {
        parentNode: rootnode,
        start:0,
        end: 0,
        type: states.normal,
        childTokens: []
    } as TmpToken

    const setCurrentState = (newState: states) => {
        previousState = currentState
        currentState = newState
        currentMachineState = stateMachine[currentState]
    }

    const length = key.length
    for (var i = 0; i < length; i++) {
        const ch = key.charCodeAt(i);


        const nextState = currentMachineState[ch]
        if(nextState == null || nextState === currentState){ continue }


        if(nextState === states.previous){
            setCurrentState(previousState)
            currentToken.end = i
            if(currentToken.parentNode === rootnode){
                rootnode.tokens.push(currentToken)
                currentToken = {
                    parentNode: rootnode,
                    start:i + 1,
                    end: i + 1,
                    type: states.normal,
                    childTokens: []
                }
                continue
            }
            const parentNode = currentToken.parentNode as TmpToken
            parentNode.childTokens.push(currentToken)
            currentToken = parentNode
            continue
        }
        switch(currentState){
            case states.normal:
                currentToken.end = i
                if(currentToken.end > currentToken.start){
                    rootnode.tokens.push(currentToken)
                }
                currentToken = {
                    parentNode: rootnode,
                    start:i + 1,
                    end: i + 1,
                    type: nextState,
                    childTokens: [],
                }
            break
            default:

                const newToken = {
                    parentNode: currentToken,
                    start:i + 1,
                    end: i + 1,
                    type: nextState,
                    childTokens: [],
                }
                currentToken = newToken

        }
        setCurrentState(nextState)
    }
    currentToken.end = key.length
    if(currentToken.end > currentToken.start){
        rootnode.tokens.push(currentToken)
    }
    const toToken: (a: TmpToken) => Token = ({start, end, type, childTokens}: TmpToken) => ({
        start, end, type,
        text: key.substring(start, end),
        childTokens: childTokens.map(toToken)
    })
    
    return {
        key,
        tokens: rootnode.tokens.map(toToken)
    };
}

export function parseKey(key: string) {
    const result = {
        priority: [0,0,0],
        key
    } as parseResult

    const ast = getAST(key);
    const captures = ast.tokens.filter(token => token.type === states.capture)

    if(captures.length <= 0){
        result.priority[0] = 1
        result.matches = matchesEquality(key)
        return result
    }

    result.priority[2] = 1
    result.matches = matchesEquality(key)
    return result
}



/// matchers
const matchesEquality = (key: string) => (text: string) => text === key




/// types

type parseResult = {
    /**
     * Defined the priority of parsing
     */
    priority: [number, number, number]
    key: string
    matches(text: string): boolean
}

type TmpAST = {
    tokens: TmpToken[]
}

type AST = {
    key: string,
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