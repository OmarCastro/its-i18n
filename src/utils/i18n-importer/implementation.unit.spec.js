import { test } from '../../../test-utils/unit/test.js'
import { importI18nJson, importTranslations } from './implementation.js'

test('Given `fetch` returns a valid, normalized json, `importI18nJson` should return the same json', async ({ expect }) => {
  const oldFetch = fetch
  const fetchResult = {
    en: { import: ['./translations.en.json'], translations: {} },
    es: { import: ['./translations.es.json'], translations: {} },
    pt: { import: ['./translations.pt.json'], translations: {} },
  }
  globalThis.fetch = () =>
    Promise.resolve({
      json: () => Promise.resolve(fetchResult),
    })

  const result = await importI18nJson('.', import.meta.url)
  expect(result).toEqual(fetchResult)

  globalThis.fetch = oldFetch
})

test('Given `fetch` returns a non normalized json, `importI18nJson` should return a normalized translations', async ({ expect }) => {
  const oldFetch = fetch
  const fetchResult = {
    en: { import: './translations.en.json' },
    es: { import: './translations.es.json' },
    pt: { import: './translations.pt.json' },
  }
  globalThis.fetch = () =>
    Promise.resolve({
      json: () => Promise.resolve(fetchResult),
    })

  const result = await importI18nJson('.', import.meta.url)
  expect(result).toEqual({
    en: { import: ['./translations.en.json'], translations: {} },
    es: { import: ['./translations.es.json'], translations: {} },
    pt: { import: ['./translations.pt.json'], translations: {} },
  })

  globalThis.fetch = oldFetch
})

test('Given `fetch` returns a json with errors, `importI18nJson` should return a corrected and normalized i18n definition and log erros', async ({ expect }) => {
  const oldFetch = fetch
  const fetchResult = {
    en: { import: ['./translations.en.json', null, {}] },
    es: { import: ['./translations.es.json', 1, []] },
    pt: { import: './translations.pt.json', translation: [null] },
  }
  globalThis.fetch = () =>
    Promise.resolve({
      json: () => Promise.resolve(fetchResult),
    })

  const importMetaUrl = 'http://localhost:8080'
  const result = await importI18nJson('.', importMetaUrl)
  expect(result).toEqual({
    en: { import: ['./translations.en.json'], translations: {} },
    es: { import: ['./translations.es.json'], translations: {} },
    pt: { import: ['./translations.pt.json'], translations: {} },
  })

  globalThis.fetch = oldFetch
})

test('Given `fetch` returns a valid non normalized json, `importTranslations` should return the same json', async ({ expect }) => {
  const oldFetch = fetch
  const fetchResult = {
    'hello world': 'olá mundo',
    'I like red color': 'Gosto da cor vermelha',
    'I will go in a bus': 'Irei de autocarro',
  }
  globalThis.fetch = () =>
    Promise.resolve({
      json: () => Promise.resolve(fetchResult),
    })

  const result = await importTranslations('.', import.meta.url)
  expect(result).toEqual(fetchResult)

  globalThis.fetch = oldFetch
})
