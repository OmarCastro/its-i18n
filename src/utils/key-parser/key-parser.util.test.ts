import { test } from '../../../test-utils/unit/test.ts'
import { getAST, parseKey, states } from './key-parser.util.ts'

test('Given a simple string, getAST should return an AST with one token', async ({ step, expect }) => {
  const ast = getAST('hello world')
  expect(ast.tokens).toEqual([{
    start: 0,
    end: 11,
    type: states.normal,
    text: 'hello world',
    childTokens: [],
  }])
})

test('Given a simple template string, getAST should return an AST with 3 tokens', async ({ step, expect }) => {
  const ast = getAST('hello {} world')
  expect(ast.tokens).toEqual([
    { start: 0, end: 6, type: states.normal, text: 'hello ', childTokens: [] },
    { start: 7, end: 7, type: states.capture, text: '', childTokens: [] },
    { start: 8, end: 14, type: states.normal, text: ' world', childTokens: [] },
  ])
})

test('Given a template string with "number" keyword, getAST should return an AST with 3 tokens', async ({ step, expect }) => {
  const ast = getAST('I see {number} worlds')
  expect(ast.tokens).toEqual([
    { start: 0, end: 6, type: states.normal, text: 'I see ', childTokens: [] },
    {
      start: 7,
      end: 13,
      type: states.capture,
      text: 'number',
      childTokens: [],
    },
    {
      start: 14,
      end: 21,
      type: states.normal,
      text: ' worlds',
      childTokens: [],
    },
  ])
})

test('Given a template string with "regex" keyword, getAST should return an AST with 3 tokens and capture token has regex step ', async ({ step, expect }) => {
  const ast = getAST('I see { /^[0-9]/ } worlds')
  expect(ast.tokens).toEqual([
    { start: 0, end: 6, type: states.normal, text: 'I see ', childTokens: [] },
    {
      start: 7,
      end: 17,
      type: states.capture,
      text: ' /^[0-9]/ ',
      childTokens: [
        { start: 9, end: 15, type: states.regex, text: '^[0-9]', childTokens: [] },
      ],
    },
    {
      start: 18,
      end: 25,
      type: states.normal,
      text: ' worlds',
      childTokens: [],
    },
  ])
})

test('Given a string with escaped initial curly brace, getAST should return an AST with 1 tokens', async ({ step, expect }) => {
  const ast = getAST('hello \\{} world')
  expect(ast.tokens).toEqual([{
    start: 0,
    end: 15,
    type: states.normal,
    text: 'hello \\{} world',
    childTokens: [],
  }])
})

test('Given a simple string, parseKey should return a result with max priority', async ({ step, expect }) => {
  const parseKeyResult = parseKey('hello world')
  const { priority, key } = parseKeyResult

  expect({ priority, key }).toEqual({
    priority: [1, 0, 0],
    key: 'hello world',
  })
})

test('Given a simple dynamic string, parseKey should return a result', async ({ step, expect }) => {
  const parseKeyResult = parseKey('hello {}')
  const { priority, key, normalizedKey } = parseKeyResult

  expect({ priority, key, normalizedKey }).toEqual({
    priority: [0, 0, 1],
    key: 'hello {}',
    normalizedKey: key,
  })
})

test('Given a string with spaces inside curly braces {}, parseKey should return a result with a normalized key', async ({ step, expect }) => {
  const parseKeyResult = parseKey('hello { number }')
  const { priority, key, normalizedKey } = parseKeyResult

  expect({ priority, key, normalizedKey }).toEqual({
    priority: [0, 0, 1],
    key: 'hello { number }',
    normalizedKey: 'hello {number}',
  })
})
