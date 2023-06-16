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

test('Given a string with spaces inside curly braces {} and expression separator, parseKey should return a result with a normalized key', ({ expect }) => {
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

test('Given a simple string, parseKey.matches should return return true only on same string', ({ expect }) => {
  const parseKeyResult = parseKey('hello world')
  const { matches } = parseKeyResult

  expect({
    'hello world': matches('hello world'),
    'hello World': matches('hello World'),
    ' hello world ': matches(' hello world '),
    'undefined': matches(undefined as never),
  }).toEqual({
    'hello world': true,
    'hello World': false,
    ' hello world ': false,
    'undefined': false,
  })
})

test('Given a string with { number } capture key , parseKey.matches should return return true only on numbers on string', ({ expect }) => {
  const parseKeyResult = parseKey('I found { number } planets')
  const { matches } = parseKeyResult

  expect({
    'I found 1 planets': matches('I found 1 planets'),
    'I found NaN planets': matches('I found NaN planets'),
    'I found some planets': matches('I found some planets'),
    'I found  1  planets ': matches('I found  1  planets'),
    'undefined': matches(undefined as never),
  }).toEqual({
    'I found 1 planets': true,
    'I found NaN planets': false,
    'I found some planets': false,
    'I found  1  planets ': false,
    'undefined': false,
  })
})

test('Given a string with { string } capture key , parseKey.matches should return return true only on text with quotes on them', ({ expect }) => {
  const parseKeyResult = parseKey('The message received is { string }')
  const { matches } = parseKeyResult

  expect({
    'The message received is ""': matches('The message received is ""'),
    'The message received is \'\'': matches('The message received is \'\''),
    'The message received is `yes`': matches('The message received is `yes`'),
    'The message received is ': matches('The message received is '),
    'The message received is "\\""': matches('The message received is "\\""'),
    'undefined': matches(undefined as never),
  }).toEqual({
    'The message received is ""': true,
    'The message received is \'\'': true,
    'The message received is `yes`': true,
    'The message received is ': false,
    'The message received is "\\""': true,
    'undefined': false,
  })
})
