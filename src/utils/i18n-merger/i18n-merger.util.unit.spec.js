import { test } from '../../../test-utils/unit/test.js'
import { builder } from './i18n-merger.util.js'

test('Given a single map, merge return a normalized definition', ({ expect }) => {
  const oldFetch = fetch

  const result = builder.addMap({
    en: { import: './translations.en.json', translations: {} },
    es: { import: './translations.es.json', translations: {} },
    pt: { import: './translations.pt.json', translations: {} },
  }, 'https://omarcastro.website').build()

  expect(result).toEqual({
    en: { import: ['https://omarcastro.website/translations.en.json'], translations: {} },
    es: { import: ['https://omarcastro.website/translations.es.json'], translations: {} },
    pt: { import: ['https://omarcastro.website/translations.pt.json'], translations: {} },
  })

  globalThis.fetch = oldFetch
})

test('Given a single map and a definition in a language, merge return a normalized definition', ({ expect }) => {
  const oldFetch = fetch

  const result = builder.addMap({
    en: { import: './translations.en.json', translations: {} },
    es: { import: './translations.es.json', translations: {} },
    pt: { import: './translations.pt.json', translations: {} },
  }, 'https://omarcastro.website')
    .addDefinitionOnLanguage('./translations.en-us.json', 'en-US', 'https://omarcastro.github.com/OmarCastro/its-i18n/')
    .build()

  expect(result).toEqual({
    en: { import: ['https://omarcastro.website/translations.en.json'], translations: {} },
    es: { import: ['https://omarcastro.website/translations.es.json'], translations: {} },
    pt: { import: ['https://omarcastro.website/translations.pt.json'], translations: {} },
    'en-US': { import: ['https://omarcastro.github.com/OmarCastro/its-i18n/translations.en-us.json'], translations: {} },
  })

  globalThis.fetch = oldFetch
})

test('Given a single map and a translation in a language, merge return a normalized definition', ({ expect }) => {
  const oldFetch = fetch

  const result = builder.addMap({
    en: { import: './translations.en.json', translations: {} },
    es: { import: './translations.es.json', translations: {} },
    pt: { import: './translations.pt.json', translations: {} },
  }, 'https://omarcastro.website').addTranslations('https://omarcastro.website/translations.en-us.json', 'en-US').build()

  expect(result).toEqual({
    en: { import: ['https://omarcastro.website/translations.en.json'], translations: {} },
    es: { import: ['https://omarcastro.website/translations.es.json'], translations: {} },
    pt: { import: ['https://omarcastro.website/translations.pt.json'], translations: {} },
    'en-US': { import: ['https://omarcastro.website/translations.en-us.json'], translations: {} },
  })

  globalThis.fetch = oldFetch
})
