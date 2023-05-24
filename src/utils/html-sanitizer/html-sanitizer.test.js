// @ts-check
import '../../../test-utils/unit/init-dom.ts'
import { test } from '../../../test-utils/unit/test.ts'
import { sanitizeI18nHtml } from './html-sanitizer.js'

test('Given a clean, sanitized html, sanitizeI18nHtml should return the same content', ({ expect }) => {
  const input = '<p>aaa</p>'
  expect(sanitizeI18nHtml(input)).toEqual(input)
})
