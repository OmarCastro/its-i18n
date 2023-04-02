import { test } from '../../../test-utils/unit/test.ts'
import { normalizeI18nDefinition, normalizeI18nDefinitionMap } from './implementation.ts'

test('Given an invalid input type, normalizeI18nDefinition returns empty definition with error', ({ expect }) => {
  const input = null as never
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: { extends: [], translations: {} },
    errors: [{ path: '', message: `invalid type` }],
  })
})

test('Given an empty string, normalizeI18nDefinition returns empty definition with error', ({ expect }) => {
  const input = ''
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: { extends: [], translations: {} },
    errors: [{ path: '', message: 'cannot import empty path, ignoring extends' }],
  })
})

test('Given a valid string, normalizeI18nDefinition normalizes to an singluar tuple extends', ({ expect }) => {
  const input = 'lang.en.json'
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      extends: [input],
      translations: {},
    },
    errors: [],
  })
})

test('Given an valid array, normalizeI18nDefinition normalizes to an tuple extends', ({ expect }) => {
  const input = ['lang.en.json', 'customization.lang.en']
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      extends: input,
      translations: {},
    },
    errors: [],
  })
})

test('Given an array with errors, normalizeI18nDefinition normalizes to an tuple extends with erros', ({ expect }) => {
  const input = ['lang.en.json', '', null, undefined] as never
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      extends: ['lang.en.json'],
      translations: {},
    },
    errors: [
      { path: '.[1]', message: 'cannot import empty path, ignoring extends' },
      { path: '.[2]', message: 'expected string instead of null, ignoring extends' },
      { path: '.[3]', message: 'expected string instead of undefined, ignoring extends' },
    ],
  })
})

test('Given an object with null extends, normalizeI18nDefinition normalizes to empty definition with error', ({ expect }) => {
  const input = { extends: null } as never
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      extends: [],
      translations: {},
    },
    errors: [
      { path: '.extends', message: 'expected string or string array (string[]) instead of null' },
    ],
  })
})

test('Given an object with empty string extends, normalizeI18nDefinition normalizes to empty definition with error', ({ expect }) => {
  const input = { extends: '' } as never
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      extends: [],
      translations: {},
    },
    errors: [
      { path: '.extends', message: 'cannot import empty path, ignoring extends' },
    ],
  })
})

test('Given a valid extends string, normalizeI18nDefinition normalizes to an singluar tuple extends', ({ expect }) => {
  const input = { extends: 'lang.en.json' }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      extends: ['lang.en.json'],
      translations: {},
    },
    errors: [],
  })
})

test('Given an object with extends arry with errors, normalizeI18nDefinition normalizes to an tuple extends with erros', ({ expect }) => {
  const input = { extends: [null, 'lang.en.json', '', 123, {}] } as never
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      extends: ['lang.en.json'],
      translations: {},
    },
    errors: [
      { path: '.extends[0]', message: 'expected string instead of null, ignoring extends' },
      { path: '.extends[2]', message: 'cannot import empty path, ignoring extends' },
      { path: '.extends[3]', message: 'expected string instead of number, ignoring extends' },
      { path: '.extends[4]', message: 'expected string instead of object, ignoring extends' },
    ],
  })
})

test('Given an object with valid extends array, normalizeI18nDefinition normalizes to an tuple extends', ({ expect }) => {
  const input = { extends: ['lang.en.json', 'customization.en.json'] } as never
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      extends: ['lang.en.json', 'customization.en.json'],
      translations: {},
    },
    errors: [],
  })
})

test('Given an object with valid extends array and translation, normalizeI18nDefinition returns an equal result', ({ expect }) => {
  const input = { extends: ['lang.en.json', 'customization.en.json'], translations: {} }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: input,
    errors: [],
  })
})

test('Given an valid translation object, normalizeI18nDefinition returns an result with an empty extends', ({ expect }) => {
  const input = {
    translations: {
      'hello world': 'olá mundo',
    },
  }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: { extends: [], translations: input.translations },
    errors: [],
  })
})

test('Given an invalid object, normalizeI18nDefinition empty definition with error', ({ expect }) => {
  const input = { lorem: ['lang.en.json', 'customization.en.json'], ipsum: {} } as never
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: { extends: [], translations: {} },
    errors: [{ path: '', message: 'invalid object, the object must have "extends" or "translations" keys' }],
  })
})

test('Given an invalid object, normalizeI18nDefinition empty definition with error', ({ expect }) => {
  const input = { lorem: ['lang.en.json', 'customization.en.json'], ipsum: {} } as never
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: { extends: [], translations: {} },
    errors: [{ path: '', message: 'invalid object, the object must have "extends" or "translations" keys' }],
  })
})

test('Given an object only with an invalid translation object, normalizeI18nDefinition empty definition with error', ({ expect }) => {
  const input = { translations: '' } as never
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: { extends: [], translations: {} },
    errors: [{ path: '.translations', message: 'expected a plain object instead of string' }],
  })
})

test('Given an object only with an invalid translation object, normalizeI18nDefinition empty definition with error', ({ expect }) => {
  const input = {
    translations: {
      'hello world': 'olá mundo',
      'I like red color': 'Gosto da cor vermelha',
      'I will go in a bus': { lorem: 'ipsum' },
    },
  } as never
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      extends: [],
      translations: {
        'hello world': 'olá mundo',
        'I like red color': 'Gosto da cor vermelha',
      },
    },
    errors: [{ path: '.translations["I will go in a bus"]', message: 'expected string instead of object' }],
  })
})

test('Given a valid object, normalizeI18nDefinitionMap returns a normalized definition map', ({ expect }) => {
  const inputMap = {
    'pt': ['lang.pt.json', 'customization.pt.json'],
    'pt-BR': 'customization-br.pt-BR.json',
  }
  const result = normalizeI18nDefinitionMap(inputMap)
  expect(result).toEqual({
    result: {
      'pt': { extends: ['lang.pt.json', 'customization.pt.json'], translations: {} },
      'pt-BR': { extends: ['customization-br.pt-BR.json'], translations: {} },
    },
    errors: [],
    warnings: [],
  })
})

test('Given an i18n with configuration error, returns a normalized definition with errors', ({ expect }) => {
  const inputMap = {
    'pt': {
      extends: ['lang.pt.json', 'customization.pt.json', null],
    },
    'pt-BR': ['customization-br.pt-BR.json', null],
    es: {
      translations: {
        'hello world': 'hola mundo',
        'I like red color': 'Me gusta la color roja',
        'I will go in a bus': 'Iré en un autobús',
        'lorem ipsum': { 'and I': 'mus fail' },
      },
    },
  } as never
  const result = normalizeI18nDefinitionMap(inputMap)
  expect(result).toEqual({
    result: {
      'pt': { extends: ['lang.pt.json', 'customization.pt.json'], translations: {} },
      'pt-BR': { extends: ['customization-br.pt-BR.json'], translations: {} },
      es: {
        extends: [],
        translations: {
          'hello world': 'hola mundo',
          'I like red color': 'Me gusta la color roja',
          'I will go in a bus': 'Iré en un autobús',
        },
      },
    },
    errors: [
      {
        path: '.pt.extends[2]',
        message: 'expected string instead of null, ignoring extends',
      },
      {
        path: '.["pt-BR"][1]',
        message: 'expected string instead of null, ignoring extends',
      },
      {
        path: '.es.translations["lorem ipsum"]',
        message: 'expected string instead of object',
      },
    ],
    warnings: [],
  })
})

test('Given an i18n with invalid locale, returns a normalized definition with errors and without the invalid locale', ({ expect }) => {
  const inputMap = {
    'lorepm ipsum': 'lang.invalid.json',
    'es': 'lang.es.json',
  } as never
  const result = normalizeI18nDefinitionMap(inputMap)
  expect(result).toEqual({
    result: {
      'es': { extends: ['lang.es.json'], translations: {} },
    },
    errors: [
      {
        path: '.["lorepm ipsum"]',
        message: 'invalid locale "lorepm ipsum", it will be ignored',
      },
    ],
    warnings: [],
  })
})

test('Given an i18n with an reserved locale such as "en-UK" locale, returns a normalized definition fixing the locale (e.g. en-UK to en-GB)', ({ expect }) => {
  const inputMap = {
    'en': 'lang.en.json',
    'en-UK': 'lang.en-uk.json',
  } as never
  const result = normalizeI18nDefinitionMap(inputMap)
  expect(result).toEqual({
    result: {
      'en': { extends: ['lang.en.json'], translations: {} },
      'en-GB': { extends: ['lang.en-uk.json'], translations: {} },
    },
    warnings: [{
      path: '.["en-UK"]',
      message: 'invalid locale "en-UK", fixed to locale "en-GB"',
    }],
    errors: [],
  })
})

test('Given an i18n with an conflicting locale such as "en-UK" & "en-gb" locale, returns a normalized definition removing invaild locale without fixing and merging with the correct one', ({ expect }) => {
  const inputMap = {
    'en': 'lang.en.json',
    'en-UK': 'lang.en-uk.json',
    'en-GB': 'lang.en-gb.json',
  } as never
  const result = normalizeI18nDefinitionMap(inputMap)
  expect(result).toEqual({
    result: {
      'en': { extends: ['lang.en.json'], translations: {} },
      'en-GB': { extends: ['lang.en-gb.json'], translations: {} },
    },
    errors: [{
      path: '.["en-UK"]',
      message: 'invalid locale "en-UK", it also conflicts with correct locale "en-GB", it will be ignored',
    }],
    warnings: [],
  })
})
