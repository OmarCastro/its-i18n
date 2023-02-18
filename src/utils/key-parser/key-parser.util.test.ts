
import { test } from '../../../test-utils/unit/test.ts';
import { parseKey } from './key-parser.util.ts';



test("Given a simple string, parseKey should return a result with max priority", async ({step, expect}) => {
    
    const parseKeyResult = parseKey("hello world");
    const {priority, key} = parseKeyResult

    expect({priority, key}).toEqual({
        priority: [1,0,0],
        key: "hello world"
    })

});

test("Given a dynamic string, parseKey should return a result", async ({step, expect}) => {
    
    const parseKeyResult = parseKey("hello {}");
    const {priority, key} = parseKeyResult

    expect({priority, key}).toEqual({
        priority: [0,0,1],
        key: "hello {}"
    })

});