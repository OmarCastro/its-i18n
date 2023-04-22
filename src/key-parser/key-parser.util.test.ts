import { test } from '../../test-utils/unit/test.ts'
import { parseKey } from './key-parser.util.ts'

test('Given a simple string, parseKey should return a result with max priority', ({ expect }) => {
  const parseKeyResult = parseKey('hello world')
  const { priority, key } = parseKeyResult

  expect({ priority, key }).toEqual({
    priority: [0, 0],
    key: 'hello world',
  })
})

test('Given a simple dynamic string, parseKey should return a result', ({ expect }) => {
  const parseKeyResult = parseKey('hello {}')
  const { priority, key, normalizedKey } = parseKeyResult

  expect({ priority, key, normalizedKey }).toEqual({
    priority: [1, 100],
    key: 'hello {}',
    normalizedKey: key,
  })
})

test('Given a string with spaces inside curly braces {}, parseKey should return a result with a normalized key', ({ expect }) => {
  const parseKeyResult = parseKey('hello { number }')
  const { priority, key, normalizedKey } = parseKeyResult

  expect({ priority, key, normalizedKey }).toEqual({
    priority: [1, 400],
    key: 'hello { number }',
    normalizedKey: 'hello {number}',
  })
})

test('Given a string with spaces inside curly braces {}, parseKey should return a result with a normalized key', ({ expect }) => {
  const parseKeyResult = parseKey('hello { number | string }')
  const { priority, key, normalizedKey } = parseKeyResult

  expect({ priority, key, normalizedKey }).toEqual({
    priority: [1, 300],
    key: 'hello { number | string }',
    normalizedKey: 'hello {number|string}',
  })
})

test('Given a string with spaces between multi-word keywords {}, parseKey should return a result with a normalized key', ({ expect }) => {
  const parseKeyResult = parseKey('hello {  future  date | unix  timestamp    }')
  const { priority, key, normalizedKey } = parseKeyResult

  expect({ priority, key, normalizedKey }).toEqual({
    priority: [1, 550],
    key: 'hello {  future  date | unix  timestamp    }',
    normalizedKey: 'hello {future date|unix timestamp}',
  })
})
