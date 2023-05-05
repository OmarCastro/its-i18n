import { test } from '../../../test-utils/unit/test.ts'
import { queryFromTranslations } from './translation-query.util.ts'

test('Given a simple translation, queryFromTranslations with a declared key should return a key with found flag enable', ({ expect }) => {
  const translations = {
    'hello world': 'hello world',
  }

  const targetKey = 'hello world'

  const result = queryFromTranslations(targetKey, translations)

  expect(result).toEqual({
    ...result,
    targetKey,
    translations,
    found: true,
    valueTemplate: 'hello world',
  })
})

test('Given a simple translation, queryFromTranslations with a non declared should return a same key but with not found flag enabled', ({ expect }) => {
  const translations = {
    'hello World': 'hello world',
  }

  const targetKey = '404 not found'

  const result = queryFromTranslations(targetKey, translations)

  expect(result).toEqual({
    ...result,
    targetKey,
    translations,
    found: false,
    valueTemplate: '',
  })
})

test('Given a translation with number capure expression, queryFromTranslations with a non declared should search it and return a translated key with found flag enabled', ({ expect }) => {
  const translations = {
    'I found 0 balls': 'I did not found any balls',
    'I found { number } balls': 'I did found {0} balls',
  }

  const result1 = queryFromTranslations('I found 0 balls', translations)
  const result2 = queryFromTranslations('I found 5 balls', translations)

  expect({ result1, result2 }).toEqual({
    result1: {
      ...result1,
      targetKey: 'I found 0 balls',
      translations,
      found: true,
      valueTemplate: 'I did not found any balls',
    },
    result2: {
      ...result2,
      targetKey: 'I found 5 balls',
      translations,
      found: true,
      valueTemplate: 'I did found {0} balls',
    },
  })
})
