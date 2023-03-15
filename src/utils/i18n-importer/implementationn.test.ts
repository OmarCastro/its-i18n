import { test } from '../../../test-utils/unit/test.ts'
import { importI18nJson, importLanguage } from './implementation.ts'

test('Given fetching a json returns a valid, complete json, it should return the same json', async ({ expect }) => {
  const oldFetch = fetch
  const expectedResult = {
    'en': { 'extends': './translations.en.json', translations: {} },
    'es': { 'extends': './translations.es.json', translations: {} },
    'pt': { 'extends': './translations.pt.json', translations: {} },
  }
  globalThis.fetch = () =>
    Promise.resolve({
      json: () => Promise.resolve(expectedResult),
    } as Response)

  const result = await importI18nJson('.', import.meta.url)
  expect(result).toEqual(expectedResult)

  globalThis.fetch = oldFetch
})

test('Given fetching a json returns a json without translation, it should fill it with empty translations', async ({ expect }) => {
  const oldFetch = fetch
  const expectedResult = {
    'en': { 'extends': './translations.en.json' },
    'es': { 'extends': './translations.es.json' },
    'pt': { 'extends': './translations.pt.json' },
  }
  globalThis.fetch = () =>
    Promise.resolve({
      json: () => Promise.resolve(expectedResult),
    } as Response)

  const result = await importI18nJson('.', import.meta.url)
  expect(result).toEqual({
    'en': { 'extends': './translations.en.json', translations: {} },
    'es': { 'extends': './translations.es.json', translations: {} },
    'pt': { 'extends': './translations.pt.json', translations: {} },
  })

  globalThis.fetch = oldFetch
})
