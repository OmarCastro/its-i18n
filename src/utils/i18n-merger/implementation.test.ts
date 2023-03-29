import { test } from '../../../test-utils/unit/test.ts'
import { builder } from './implementation.ts'

test('Given a single data, merge return a normalized definition', ({ expect }) => {
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
