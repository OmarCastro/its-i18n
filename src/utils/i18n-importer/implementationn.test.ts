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
