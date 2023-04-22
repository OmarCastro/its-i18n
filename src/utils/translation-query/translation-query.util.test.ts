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

test('Given a translation with number capure expression, queryFromTranslations with a non declared should search it and return a translated key with found flag enabled', ({ expect }) => {
  const translations = {
    'I found 0 balls': 'I did not found any balls',
    'I found { number } balls': 'I did found {0} balls',
  }

  expect(queryFromTranslations('I found 0 balls', translations)).toEqual({
    targetKey: 'I found 0 balls',
    translations,
    found: true,
    value: 'I did not found any balls',
  })

  expect(queryFromTranslations('I found 5 balls', translations)).toEqual({
    targetKey: 'I found 5 balls',
    translations,
    found: true,
    value: 'I did found 5 balls',
  })
})
