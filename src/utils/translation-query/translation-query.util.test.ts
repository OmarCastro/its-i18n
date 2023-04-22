import { test } from '../../../test-utils/unit/test.ts'
import { queryFromTranslations } from './translation-query.util.ts'

test('Given a simple translation, queryFromTranslations with a declared key should return a key with found flag enable', ({ expect }) => {
  const translations = {
    'hello world': 'hello world',
  }

  const targetKey = 'hello world'
  expect(queryFromTranslations(targetKey, translations)).toEqual({
    targetKey,
    translations,
    found: true,
    value: 'hello world',
  })
})

test('Given a simple translation, queryFromTranslations with a non declared should return a same key but with not found flag enabled', ({ expect }) => {
  const translations = {
    'hello World': 'hello world',
  }

  const targetKey = '404 not found'
  expect(queryFromTranslations(targetKey, translations)).toEqual({
    targetKey,
    translations,
    found: false,
    value: targetKey,
  })
})
