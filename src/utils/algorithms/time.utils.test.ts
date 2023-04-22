import { test } from '../../../test-utils/unit/test.ts'
import { parseISO8601 } from './time.utils.ts'

test('isNumeric unit tests...', ({ expect }) => {
  expect(parseISO8601({} as never)).toEqual(NaN)
  expect(parseISO8601('asd')).toEqual(NaN)
  expect(parseISO8601('12.45')).toEqual(NaN)
  expect(parseISO8601('2023-12-12T12:00:00Z')).toEqual(1702382400000)
})
