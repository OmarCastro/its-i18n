
/// states
enum states {
    normal = 1,
    capture,
    regex,
    sq_string,
    dq_string,
    t_string,
    escape
}

const stateMachine = [

]


export function parseKey(key: string) {
    const result = {
        priority: [0,0,0],
        key
    } as parseResult

    const captures = []

    const length = key.length
    for (var i = 0; i < length; i++) {
        const char = key.charAt(i);
    }

    if(captures.length <= 0){
        result.priority[0] = 1
        result.matches = matchesEquality(key)
        return result
    }

    result.priority[1] = 1
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