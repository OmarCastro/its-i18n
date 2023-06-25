import { test } from '../../../test-utils/unit/test.js'
import { normalizeI18nDefinition, normalizeI18nDefinitionMap } from './i18n-normalizer.js'

test('Given an invalid input type, normalizeI18nDefinition returns empty definition with error', ({ expect }) => {
  const input = null
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: { import: [], translations: {} },
    errors: [{ path: '', message: 'invalid type' }],
  })
})

test('Given an empty string, normalizeI18nDefinition returns empty definition with error', ({ expect }) => {
  const input = ''
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: { import: [], translations: {} },
    errors: [{ path: '', message: 'cannot import empty path, ignoring import' }],
  })
})

test('Given a valid string, normalizeI18nDefinition normalizes to an singluar tuple import', ({ expect }) => {
  const input = 'lang.en.json'
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      import: [input],
      translations: {},
    },
    errors: [],
  })
})

test('Given an valid array, normalizeI18nDefinition normalizes to an tuple import', ({ expect }) => {
  const input = ['lang.en.json', 'customization.lang.en']
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      import: input,
      translations: {},
    },
    errors: [],
  })
})

test('Given an array with errors, normalizeI18nDefinition normalizes to an tuple import with erros', ({ expect }) => {
  const input = ['lang.en.json', '', null, undefined]
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      import: ['lang.en.json'],
      translations: {},
    },
    errors: [
      { path: '.[1]', message: 'cannot import empty path, ignoring import' },
      { path: '.[2]', message: 'expected string instead of null, ignoring import' },
      { path: '.[3]', message: 'expected string instead of undefined, ignoring import' },
    ],
  })
})

test('Given an object with null import, normalizeI18nDefinition normalizes to empty definition with error', ({ expect }) => {
  const input = { import: null }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      import: [],
      translations: {},
    },
    errors: [
      { path: '.import', message: 'expected string or string array (string[]) instead of null' },
    ],
  })
})

test('Given an object with empty string import, normalizeI18nDefinition normalizes to empty definition with error', ({ expect }) => {
  const input = { import: '' }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      import: [],
      translations: {},
    },
    errors: [
      { path: '.import', message: 'cannot import empty path, ignoring import' },
    ],
  })
})

test('Given a valid import string, normalizeI18nDefinition normalizes to an singluar tuple import', ({ expect }) => {
  const input = { import: 'lang.en.json' }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      import: ['lang.en.json'],
      translations: {},
    },
    errors: [],
  })
})

test('Given an object with import arry with errors, normalizeI18nDefinition normalizes to an tuple import with erros', ({ expect }) => {
  const input = { import: [null, 'lang.en.json', '', 123, {}] }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      import: ['lang.en.json'],
      translations: {},
    },
    errors: [
      { path: '.import[0]', message: 'expected string instead of null, ignoring import' },
      { path: '.import[2]', message: 'cannot import empty path, ignoring import' },
      { path: '.import[3]', message: 'expected string instead of number, ignoring import' },
      { path: '.import[4]', message: 'expected string instead of object, ignoring import' },
    ],
  })
})

test('Given an object with valid import array, normalizeI18nDefinition normalizes to an tuple import', ({ expect }) => {
  const input = { import: ['lang.en.json', 'customization.en.json'] }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      import: ['lang.en.json', 'customization.en.json'],
      translations: {},
    },
    errors: [],
  })
})

test('Given an object with valid import array and translation, normalizeI18nDefinition returns an equal result', ({ expect }) => {
  const input = { import: ['lang.en.json', 'customization.en.json'], translations: {} }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: input,
    errors: [],
  })
})

test('Given an valid translation object, normalizeI18nDefinition returns an result with an empty import', ({ expect }) => {
  const input = {
    translations: {
      'hello world': 'olá mundo',
    },
  }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: { import: [], translations: input.translations },
    errors: [],
  })
})

test('Given an invalid object, normalizeI18nDefinition empty definition with error', ({ expect }) => {
  const input = { lorem: ['lang.en.json', 'customization.en.json'], ipsum: {} }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: { import: [], translations: {} },
    errors: [{ path: '', message: 'invalid object, the object must have "import" or "translations" keys' }],
  })
})

test('Given an object only with an invalid translation object, normalizeI18nDefinition must return an empty definition with error', ({ expect }) => {
  const input = { translations: '' }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: { import: [], translations: {} },
    errors: [{ path: '.translations', message: 'expected a plain object instead of string' }],
  })
})

test('Given an object with an invalid translation value, normalizeI18nDefinition will remove the invalid property from the result', ({ expect }) => {
  const input = {
    translations: {
      'hello world': 'olá mundo',
      'I like red color': 'Gosto da cor vermelha',
      'I will go in a bus': { lorem: 'ipsum' },
    },
  }
  const result = normalizeI18nDefinition(input)
  expect(result).toEqual({
    result: {
      import: [],
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
    pt: ['lang.pt.json', 'customization.pt.json'],
    'pt-BR': 'customization-br.pt-BR.json',
  }
  const result = normalizeI18nDefinitionMap(inputMap)
  expect(result).toEqual({
    result: {
      pt: { import: ['lang.pt.json', 'customization.pt.json'], translations: {} },
      'pt-BR': { import: ['customization-br.pt-BR.json'], translations: {} },
    },
    errors: [],
    warnings: [],
  })
})

test('Given an i18n with configuration error, returns a normalized definition with errors', ({ expect }) => {
  const inputMap = {
    pt: {
      import: ['lang.pt.json', 'customization.pt.json', null],
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
  }
  const result = normalizeI18nDefinitionMap(inputMap)
  expect(result).toEqual({
    result: {
      pt: { import: ['lang.pt.json', 'customization.pt.json'], translations: {} },
      'pt-BR': { import: ['customization-br.pt-BR.json'], translations: {} },
      es: {
        import: [],
        translations: {
          'hello world': 'hola mundo',
          'I like red color': 'Me gusta la color roja',
          'I will go in a bus': 'Iré en un autobús',
        },
      },
    },
    errors: [
      {
        path: '.pt.import[2]',
        message: 'expected string instead of null, ignoring import',
      },
      {
        path: '.["pt-BR"][1]',
        message: 'expected string instead of null, ignoring import',
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
    es: 'lang.es.json',
  }
  const result = normalizeI18nDefinitionMap(inputMap)
  expect(result).toEqual({
    result: {
      es: { import: ['lang.es.json'], translations: {} },
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
    en: 'lang.en.json',
    'en-UK': 'lang.en-uk.json',
  }
  const result = normalizeI18nDefinitionMap(inputMap)
  expect(result).toEqual({
    result: {
      en: { import: ['lang.en.json'], translations: {} },
      'en-GB': { import: ['lang.en-uk.json'], translations: {} },
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
    en: 'lang.en.json',
    'en-UK': 'lang.en-uk.json',
    'en-GB': 'lang.en-gb.json',
  }
  const result = normalizeI18nDefinitionMap(inputMap)
  expect(result).toEqual({
    result: {
      en: { import: ['lang.en.json'], translations: {} },
      'en-GB': { import: ['lang.en-gb.json'], translations: {} },
    },
    errors: [{
      path: '.["en-UK"]',
      message: 'invalid locale "en-UK", it also conflicts with correct locale "en-GB", it will be ignored',
    }],
    warnings: [],
  })
})
