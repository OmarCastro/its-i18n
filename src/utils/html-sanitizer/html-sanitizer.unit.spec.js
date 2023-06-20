// @ts-check
import '../../../test-utils/unit/init-dom.js'
import { test } from '../../../test-utils/unit/test.js'
import { sanitizeI18nHtml } from './html-sanitizer.js'

test('Given a clean, sanitized html, sanitizeI18nHtml should return the same content', ({ expect }) => {
  const input = '<p>aaa</p>'
  expect(sanitizeI18nHtml(input).html).toEqual(input)
})

test('Given a xss script, html, sanitizeI18nHtml should remove the script', ({ expect }) => {
  const input = '"><script>alert("Error! XSS executed!")</script><p>aaa</p>'
  const result = sanitizeI18nHtml(input)
  expect({
    sanitizedHtml: result.html,
    removedElementOuterHtml: result.removedElements.map((el) => el.outerHTML),
  }).toEqual({
    sanitizedHtml: '"&gt;<p>aaa</p>',
    removedElementOuterHtml: ['<script>alert("Error! XSS executed!")</script>'],
  })
})

test('Given an html with data-i18n attribute, sanitizeI18nHtml should remove them as to avoid potential infinite loops', ({ expect }) => {
  const input = '<a data-i18n="banana" data-i18n--title="I eat it">this element must not have attributes</a><p>aaa</p>'
  const result = sanitizeI18nHtml(input)
  expect({
    sanitizedHtml: result.html,
    removedElements: result.removedElements,
    removedAttributes: result.removedAttributes.map((attr) => ({ ...attr, from: attr.from.tagName.toLowerCase() })),
  }).toEqual({
    sanitizedHtml: '<a>this element must not have attributes</a><p>aaa</p>',
    removedElements: [],
    removedAttributes: [
      { name: 'data-i18n', from: 'a' },
      { name: 'data-i18n--title', from: 'a' },
    ],
  })
})

test('Given an html with aria-* attributes, sanitizeI18nHtml should maintain them even if they are unknown', ({ expect }) => {
  const input = '<div aria-label="banana">this element must have <i class="italic">aria-*</i> attributes</div>'
  const result = sanitizeI18nHtml(input)
  expect({
    sanitizedHtml: result.html,
    removedElements: result.removedElements,
    removedAttributes: result.removedAttributes,
  }).toEqual({
    sanitizedHtml: input,
    removedElements: [],
    removedAttributes: [],
  })
})
