import { test } from '../../../test-utils/unit/test.ts'
import { merge } from './implementation.ts'

test('Given a single data, merge return a normalized definition', ({ expect }) => {
  merge()
  const oldFetch = fetch
  const input = {
    'en': { 'extends': './translations.en.json', translations: {} },
    'es': { 'extends': './translations.es.json', translations: {} },
    'pt': { 'extends': './translations.pt.json', translations: {} },
  }

  expect(merge(input)).toEqual({
    'en': { 'extends': ['./translations.en.json'], translations: {} },
    'es': { 'extends': ['./translations.es.json'], translations: {} },
    'pt': { 'extends': ['./translations.pt.json'], translations: {} },
  })

  globalThis.fetch = oldFetch
})
