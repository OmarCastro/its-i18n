import { test } from '../../../test-utils/unit/test.ts'
import { builder } from './implementation.ts'

test('Given a single map, merge return a normalized definition', ({ expect }) => {
  const oldFetch = fetch

  const result = builder.addMap({
    'en': { 'extends': './translations.en.json', translations: {} },
    'es': { 'extends': './translations.es.json', translations: {} },
    'pt': { 'extends': './translations.pt.json', translations: {} },
  }, 'map.all.json').build()

  expect(result).toEqual({
    'en': { 'extends': ['./translations.en.json'], translations: {} },
    'es': { 'extends': ['./translations.es.json'], translations: {} },
    'pt': { 'extends': ['./translations.pt.json'], translations: {} },
  })

  globalThis.fetch = oldFetch
})

test('Given a single map and a definition in a language, merge return a normalized definition', ({ expect }) => {
  const oldFetch = fetch

  const result = builder.addMap({
    'en': { 'extends': './translations.en.json', translations: {} },
    'es': { 'extends': './translations.es.json', translations: {} },
    'pt': { 'extends': './translations.pt.json', translations: {} },
  }, 'map.all.json').addDefinitionOnLanguage('./translations.en-us.json', 'en-US', 'en-US-definition.json').build()

  expect(result).toEqual({
    'en': { 'extends': ['./translations.en.json'], translations: {} },
    'es': { 'extends': ['./translations.es.json'], translations: {} },
    'pt': { 'extends': ['./translations.pt.json'], translations: {} },
    'en-US': { 'extends': ['./translations.en-us.json'], translations: {} },
  })

  globalThis.fetch = oldFetch
})

test('Given a single map and a translation in a language, merge return a normalized definition', ({ expect }) => {
  const oldFetch = fetch

  const result = builder.addMap({
    'en': { 'extends': './translations.en.json', translations: {} },
    'es': { 'extends': './translations.es.json', translations: {} },
    'pt': { 'extends': './translations.pt.json', translations: {} },
  }, 'map.all.json').addTranslations('./translations.en-us.json', 'en-US').build()

  expect(result).toEqual({
    'en': { 'extends': ['./translations.en.json'], translations: {} },
    'es': { 'extends': ['./translations.es.json'], translations: {} },
    'pt': { 'extends': ['./translations.pt.json'], translations: {} },
    'en-US': { 'extends': ['./translations.en-us.json'], translations: {} },
  })

  globalThis.fetch = oldFetch
})
