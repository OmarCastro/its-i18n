import { test } from '../../../test-utils/unit/test.js'
import { isInteger, isNumeric } from './number.utils.js'

/** @type {*} */
const invalid = {}

test('isNumeric unit tests...', ({ expect }) => {
  expect(isNumeric(invalid)).toEqual(false)
  expect(isNumeric('0')).toEqual(true)
  expect(isNumeric('asd')).toEqual(false)
  expect(isNumeric('12.45')).toEqual(true)
  expect(isNumeric(' 12.45 ')).toEqual(false)
})

test('isInteger unit tests...', ({ expect }) => {
  expect(isInteger(invalid)).toEqual(false)
  expect(isInteger('0')).toEqual(true)
  expect(isInteger('asd')).toEqual(false)
  expect(isInteger('12.45')).toEqual(false)
  expect(isInteger('-1245')).toEqual(true)
  expect(isInteger('1245')).toEqual(true)
  expect(isInteger('0')).toEqual(true)
})
