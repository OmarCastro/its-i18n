import { test } from '../../../test-utils/unit/test.js'
import { queryFromTranslations } from './translation-query.util.js'

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
  expect(result.translate(new Intl.Locale('en-GB'))).toEqual(targetKey)
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

  expect(result1.translate(new Intl.Locale('en-GB'))).toEqual('I did not found any balls')
  expect(result2.translate(new Intl.Locale('en-GB'))).toEqual('I did found 5 balls')
})

test('Given a translation, queryFromTranslations called twice a should return the same result, a.k.a the function is memoized', ({ expect }) => {
  const translations = {
    'I found 0 balls': 'I did not found any balls',
    'I found { number } balls': 'I did found {0} balls',
  }

  const result1 = queryFromTranslations('I found 10 balls', translations)
  const result2 = queryFromTranslations('I found 10 balls', translations)

  expect(result1 === result2).toEqual(true)
  expect(result1).toEqual({
    ...result1,
    targetKey: 'I found 10 balls',
    translations,
    found: true,
    valueTemplate: 'I did found {0} balls',
  })
})
