import { test } from '../../test-utils/unit/test.js'
import { getAST } from './key-ast.util.js'
import { calculatePriority, getNumericValuePriority } from './priority-calculator.js'

test('Given a simple string, calculatePriority should return the max priority', ({ expect }) => {
  const ast = getAST('hello world')
  expect(calculatePriority(ast)).toEqual({
    priority: [0, 0],
    priorityAsNumber: Number.MAX_SAFE_INTEGER,
  })
})

test('Given a simple dynamic string with "any" capture, calculatePriority should return a priority of [1, 100]', ({ expect }) => {
  const ast = getAST('hello {}')
  expect(calculatePriority(ast)).toEqual(withNumericValue({
    priority: [1, 100],
  }))
})

test('Given a simple dynamic string with "number" capture, calculatePriority should return a priority of [1, 100]', ({ expect }) => {
  const ast = getAST('I found { number } rocks')
  expect(calculatePriority(ast)).toEqual(withNumericValue({
    priority: [1, 400],
  }))
})

const withNumericValue = (data) => ({
  ...data,
  priorityAsNumber: getNumericValuePriority(...data.priority),
})
