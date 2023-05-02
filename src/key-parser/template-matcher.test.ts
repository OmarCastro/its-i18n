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
