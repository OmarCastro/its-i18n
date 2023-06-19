import { test } from '../../test-utils/unit/test.js'
import { getAST, states } from './key-ast.util.ts'
import { calculatePriority, getNumericValuePriority } from './priority-calculator.ts'

test('Given a simple string, calculatePriority should return the max priority', ({ expect }) => {
  const ast = getAST('hello world')
  expect(calculatePriority(ast)).toEqual({
    priority: [0, 0],
    priorityAsNumber: Number.MAX_SAFE_INTEGER,
  })
})

test('Given a simple dynamic string with "any" capture, calculatePriority should return a priority of [1, 100]', ({ expect }) => {
  const ast = getAST('hello {}')
  expect(calculatePriority(ast)).toEqual(withNumberiValue({
    priority: [1, 100],
  }))
})

test('Given a simple dynamic string with "number" capture, calculatePriority should return a priority of [1, 100]', ({ expect }) => {
  const ast = getAST('I found { number } rocks')
  expect(calculatePriority(ast)).toEqual(withNumberiValue({
    priority: [1, 400],
  }))
})

const withNumberiValue = (data: { priority: readonly [number, number] }) => ({
  ...data,
  priorityAsNumber: getNumericValuePriority(data.priority),
})
