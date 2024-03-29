import { test } from '../../test-utils/unit/test.js'
import { getAST, states } from './key-ast.util.js'

test('Given a simple string, getAST should return an AST with one token', ({ expect }) => {
  const ast = getAST('hello world')
  expect(ast.tokens).toEqual([{
    start: 0,
    end: 11,
    type: states.normal,
    text: 'hello world',
    childTokens: [],
  }])
})

test('Given a string with double initial curly brace, getAST should return an AST with 1 tokens', ({ expect }) => {
  const ast = getAST('hello {{} world')
  expect(ast.tokens).toEqual([{
    start: 0,
    end: 15,
    type: states.normal,
    text: 'hello {} world',
    childTokens: [],
  }])
})

test('Given a simple template string, getAST should return an AST with 3 tokens', ({ expect }) => {
  const ast = getAST('hello {} world')
  expect(ast.tokens).toEqual([
    { start: 0, end: 6, type: states.normal, text: 'hello ', childTokens: [] },
    { start: 6, end: 8, type: states.capture, text: '{}', childTokens: [] },
    { start: 8, end: 14, type: states.normal, text: ' world', childTokens: [] },
  ])
})

test('Given a template string with "number" keyword, getAST should return an AST with 3 tokens', ({ expect }) => {
  const ast = getAST('I see {number} worlds')
  expect(ast.tokens).toEqual([
    { start: 0, end: 6, type: states.normal, text: 'I see ', childTokens: [] },
    {
      start: 6,
      end: 14,
      type: states.capture,
      text: '{number}',
      childTokens: [{ start: 7, end: 13, type: 2, text: 'number', childTokens: [] }],
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

test('Given a template string with "regex" keyword, getAST should return an AST with 3 tokens and capture token has regex step ', ({ expect }) => {
  const ast = getAST('I see { /^[0-9]/ } worlds')
  expect(ast.tokens).toEqual([
    { start: 0, end: 6, type: states.normal, text: 'I see ', childTokens: [] },
    {
      start: 6,
      end: 18,
      type: states.capture,
      text: '{ /^[0-9]/ }',
      childTokens: [
        { start: 8, end: 16, type: states.regex, text: '/^[0-9]/', childTokens: [] },
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

test('Given a template string with "number" or "string" keyword, getAST should return an AST with 3 tokens and capture token has 2 expressions', ({ expect }) => {
  const ast = getAST('I see { number | string } worlds')
  expect(ast.tokens).toEqual([
    { start: 0, end: 6, type: states.normal, text: 'I see ', childTokens: [] },
    {
      start: 6,
      end: 25,
      type: states.capture,
      text: '{ number | string }',
      childTokens: [
        { start: 8, end: 14, type: states.capture_expr, text: 'number', childTokens: [] },
        { start: 15, end: 16, type: states.capture_expr_sep, text: '|', childTokens: [] },
        { start: 17, end: 23, type: states.capture_expr, text: 'string', childTokens: [] },
      ],
    },
    {
      start: 25,
      end: 32,
      type: states.normal,
      text: ' worlds',
      childTokens: [],
    },
  ])
})

test('Given a template string with normalized "number" or "string" keyword, getAST should return an AST with 3 tokens and capture token has 2 expressions', ({ expect }) => {
  const ast = getAST('I see {number|string} worlds')
  expect(ast.tokens).toEqual([
    { start: 0, end: 6, type: states.normal, text: 'I see ', childTokens: [] },
    {
      start: 6,
      end: 21,
      type: states.capture,
      text: '{number|string}',
      childTokens: [
        { start: 7, end: 13, type: states.capture_expr, text: 'number', childTokens: [] },
        { start: 13, end: 14, type: states.capture_expr_sep, text: '|', childTokens: [] },
        { start: 14, end: 20, type: states.capture_expr, text: 'string', childTokens: [] },
      ],
    },
    {
      start: 21,
      end: 28,
      type: states.normal,
      text: ' worlds',
      childTokens: [],
    },
  ])
})

test('Given a template string with "multiple word" keyword, getAST should return an AST with 3 tokens and capture token has 5 child tokens ', ({ expect }) => {
  const ast = getAST('On { future date | future iso 8601 } something will happen')
  expect(ast.tokens).toEqual([
    { start: 0, end: 3, type: states.normal, text: 'On ', childTokens: [] },
    {
      start: 3,
      end: 36,
      type: states.capture,
      text: '{ future date | future iso 8601 }',
      childTokens: [
        { start: 5, end: 11, type: states.capture_expr, text: 'future', childTokens: [] },
        { start: 12, end: 16, type: states.capture_expr, text: 'date', childTokens: [] },
        { start: 17, end: 18, type: states.capture_expr_sep, text: '|', childTokens: [] },
        { start: 19, end: 25, type: states.capture_expr, text: 'future', childTokens: [] },
        { start: 26, end: 29, type: states.capture_expr, text: 'iso', childTokens: [] },
        { start: 30, end: 34, type: states.capture_expr, text: '8601', childTokens: [] },
      ],
    },
    {
      start: 36,
      end: 58,
      type: states.normal,
      text: ' something will happen',
      childTokens: [],
    },
  ])
})
