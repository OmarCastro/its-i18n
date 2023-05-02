import { test } from '../../test-utils/unit/test.ts'
import { getAST, states } from './key-ast.util.ts'
import { getMatcher } from './template-matcher.ts'

test('Given a simple string, getMatcher result should match the same sting only', ({ expect }) => {
  const ast = getAST('hello world')
  const matcher = getMatcher(ast)
  expect(matcher('hello world')).toEqual({
    isMatch: true,
    parameters: [],
    defaultFormatters: [],
  })
})

test('Given a parameterized key, getMatcher result should match the each group in a parameter', ({ expect }) => {
  const ast = getAST('I sort { number } balls in { number } buckets')
  const matcher = getMatcher(ast)

  const { isMatch, parameters } = matcher('I sort 130 balls in 5 buckets')

  expect({ isMatch, parameters }).toEqual({
    isMatch: true,
    parameters: ["130", "5"],
  })
})
