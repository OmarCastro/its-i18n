import { test } from '../../../test-utils/unit/test.ts'
import { normalizeI18nDefinition } from './implementation.ts'

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
      { path: '[1]', message: 'cannot import empty path, ignoring extends' },
      { path: '[2]', message: 'expected string instead of null, ignoring extends' },
      { path: '[3]', message: 'expected string instead of undefined, ignoring extends' },
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
