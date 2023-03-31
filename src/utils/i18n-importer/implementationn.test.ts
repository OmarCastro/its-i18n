import { test } from '../../../test-utils/unit/test.ts'
import { importI18nJson, importTranslations } from './implementation.ts'

test('Given `fetch` returns a valid, normalized json, `importI18nJson` should return the same json', async ({ expect }) => {
  const oldFetch = fetch
  const fetchResult = {
    'en': { 'extends': ['./translations.en.json'], translations: {} },
    'es': { 'extends': ['./translations.es.json'], translations: {} },
    'pt': { 'extends': ['./translations.pt.json'], translations: {} },
  }
  globalThis.fetch = () =>
    Promise.resolve({
      json: () => Promise.resolve(fetchResult),
    } as Response)

  const result = await importI18nJson('.', import.meta.url)
  expect(result).toEqual(fetchResult)

  globalThis.fetch = oldFetch
})

test('Given `fetch` returns a non normalized json, `importI18nJson` should return a normalized translations', async ({ expect }) => {
  const oldFetch = fetch
  const fetchResult = {
    'en': { 'extends': './translations.en.json' },
    'es': { 'extends': './translations.es.json' },
    'pt': { 'extends': './translations.pt.json' },
  }
  globalThis.fetch = () =>
    Promise.resolve({
      json: () => Promise.resolve(fetchResult),
    } as Response)

  const result = await importI18nJson('.', import.meta.url)
  expect(result).toEqual({
    'en': { 'extends': ['./translations.en.json'], translations: {} },
    'es': { 'extends': ['./translations.es.json'], translations: {} },
    'pt': { 'extends': ['./translations.pt.json'], translations: {} },
  })

  globalThis.fetch = oldFetch
})

test('Given `fetch` returns a json with errors, `importI18nJson` should return a corrected and normalized i18n definition and log erros', async ({ expect }) => {
  const oldFetch = fetch
  const fetchResult = {
    'en': { 'extends': ['./translations.en.json', null, {}] },
    'es': { 'extends': ['./translations.es.json', 1, []] },
    'pt': { 'extends': './translations.pt.json', translation: [null] },
  }
  globalThis.fetch = () =>
    Promise.resolve({
      json: () => Promise.resolve(fetchResult),
    } as Response)

  const importMetaUrl = 'http://localhost:8080'
  const result = await importI18nJson('.', importMetaUrl)
  expect(result).toEqual({
    'en': { 'extends': ['./translations.en.json'], translations: {} },
    'es': { 'extends': ['./translations.es.json'], translations: {} },
    'pt': { 'extends': ['./translations.pt.json'], translations: {} },
  })

  globalThis.fetch = oldFetch
})
