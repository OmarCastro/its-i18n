import { test } from '../../../test-utils/unit/test.ts'
import { isInteger, isNumeric } from './number.utils.ts'

test('isNumeric unit tests...', ({ expect }) => {
  expect(isNumeric({} as never)).toEqual(false)
  expect(isNumeric('asd')).toEqual(false)
  expect(isNumeric('12.45')).toEqual(true)
  expect(isNumeric(' 12.45 ')).toEqual(false)
})

test('isInteger unit tests...', ({ expect }) => {
  expect(isInteger({} as never)).toEqual(false)
  expect(isInteger('asd')).toEqual(false)
  expect(isInteger('12.45')).toEqual(false)
  expect(isInteger('-1245')).toEqual(true)
  expect(isInteger('1245')).toEqual(true)
  expect(isInteger('0')).toEqual(true)
})
