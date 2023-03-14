import { test } from '../../../test-utils/unit/test.ts'
import { importI18nJson, importLanguage } from './implementation.ts'

test('Given a valid json ', async ({ step: originalStep, expect }) => {
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
  expect(result).toEqual(expectedResult)

  globalThis.fetch = oldFetch
})
