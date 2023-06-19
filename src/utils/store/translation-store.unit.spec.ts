import { test } from '../../../test-utils/unit/test.js'
import { i18nTanslationStore } from './translation-store.ts'
import { provide } from '../i18n-importer/provider.ts'

test('Given a new store, when loadTranslations ', async ({ step: originalStep, expect }) => {
  const store = i18nTanslationStore()

  const translations = {
    'untranslated text': 'untranslated text',
  }

  const storeDataWithLangs = (languages) => ({ location: '', languages })

  const consoleCalls = { error: [] as unknown[], warn: [] as unknown[] }
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error
  console.warn = (...args) => {
    consoleCalls.warn.push(args)
  }

  console.error = (...args) => {
    consoleCalls.error.push(args)
  }

  const step = async (...args: Parameters<typeof originalStep>) => {
    consoleCalls.error.length = 0
    consoleCalls.warn.length = 0
    return await originalStep.apply(null, args)
  }

  await step('with "en", "pt" & "es", should load wihout problems', async () => {
    const store = i18nTanslationStore()
    store.loadTranslations(storeDataWithLangs({
      en: { translations },
      pt: { translations },
      es: { translations },
    }))
    await expect(consoleCalls).toEqual({ error: [], warn: [] })
    await expect(Object.keys(store.data.languages)).toEqual(['en', 'pt', 'es'])
  })
  await step('with "en" & "en-US", should load wihout problems', async () => {
    const store = i18nTanslationStore()
    store.loadTranslations(storeDataWithLangs({
      en: { translations },
      'en-US': { translations },
    }))
    await expect(consoleCalls).toEqual({ error: [], warn: [] })
    await expect(Object.keys(store.data.languages)).toEqual(['en', 'en-US'])
  })
  await step('with "en" & "en-UK", should warn about invalid locale "en-UK" and fixes it to "en-GB"', async () => {
    const store = i18nTanslationStore()
    store.loadTranslations(storeDataWithLangs({
      en: { translations },
      'en-UK': { translations },
    }))
    expect(consoleCalls).toEqual({
      error: [],
      warn: [
        ['Warn: Invalid locale "en-UK", fixed to locale "en-GB"'],
      ],
    })
    await expect(Object.keys(store.data.languages)).toEqual(['en', 'en-GB'])
  })

  await step('with "en", "en-UK" & "en-GB", should log error of invalid & conflicting locale and should be discarded', async () => {
    const store = i18nTanslationStore()
    store.loadTranslations(storeDataWithLangs({
      en: { translations },
      'en-UK': { translations },
      'en-GB': { translations },
    }))
    await expect(consoleCalls).toEqual({
      error: [
        ['Error: Invalid locale "en-UK", it also conflicts with correct locale "en-GB", it will not be added to the I18n store'],
      ],
      warn: [],
    })
    await expect(Object.keys(store.data.languages)).toEqual(['en', 'en-GB'])
  })

  await step(
    'with "en", "en-GB" & "en-ABC", should log error of invalid locale "en-ABC" and should discard only the invalid one',
    () => {
      const store = i18nTanslationStore()
      store.loadTranslations(storeDataWithLangs({
        en: { translations },
        'en-GB': { translations },
        'en-ABC': { translations },
      }))
      expect(consoleCalls).toEqual({
        error: [
          ['Error: Invalid locale "en-ABC", it will not be added to the I18n store'],
        ],
        warn: [],
      })
      expect(Object.keys(store.data.languages)).toEqual(['en', 'en-GB'])
    },
  )

  console.warn = originalConsoleWarn
  console.error = originalConsoleError
})

test('Given a new store, when loadTranslations from location', async ({ step: originalStep, expect, readFrom }) => {
  const consoleCalls = { error: [] as unknown[], warn: [] as unknown[] }
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error
  console.warn = (...args) => {
    consoleCalls.warn.push(args)
  }

  console.error = (...args) => {
    consoleCalls.error.push(args)
  }

  const step = async (...args: Parameters<typeof originalStep>) => {
    consoleCalls.error.length = 0
    consoleCalls.warn.length = 0
    return await originalStep.apply(null, args)
  }

  await step('from "import-extends/i18n.json" should load wihout problems', async () => {
    const impl = i18nImporterImplWith({ readFrom })
    provide(impl)

    const base = import.meta.url
    const location = './translation-store.test.ts--filesystem/import-extends/i18n.json'
    const json = await impl.importI18nJson(location, base)

    const store = i18nTanslationStore()
    store.loadTranslations({
      location: new URL(location, base).pathname,
      languages: json,
    })
    expect(consoleCalls).toEqual({ error: [], warn: [] })
    expect(store.data.languages).toEqual({
      'en': { 'extends': './translations.en.json' },
      'es': { 'extends': './translations.es.json' },
      'pt': { 'extends': './translations.pt.json' },
    })
  })

  await step('from "import-extends-outer/base/i18n.json" should load wihout problems', async () => {
    const impl = i18nImporterImplWith({ readFrom })
    provide(impl)

    const basePathFolder = './translation-store.test.ts--filesystem/import-extends-outer/base'
    const base = import.meta.url
    const location = `${basePathFolder}/i18n.json`
    const json = await impl.importI18nJson(location, base)

    const store = i18nTanslationStore()
    store.loadTranslations({
      location: new URL(location, base).pathname,
      languages: json,
    })
    expect(consoleCalls).toEqual({ error: [], warn: [] })
    expect(store.data.languages).toEqual({
      'en': { 'extends': '../languages/en/translations.en.json' },
      'es': { 'extends': '../languages/es/translations.es.json' },
      'pt': { 'extends': '../languages/pt/translations.pt.json' },
    })
  })

  console.warn = originalConsoleWarn
  console.error = originalConsoleError
})

test('Given a storeData loaded from "import-extends/i18n.json", when getting translationsFromLanguage ', async ({ step, expect, readFrom }) => {
  const importLanguageCalls = [] as { url: string; base: string }[]
  const impl = {
    importI18nJson: async (url, base) => JSON.parse(await readFrom(new URL(url, base))),
    importTranslations: async (url, base) => (importLanguageCalls.push({ url, base }), JSON.parse(await readFrom(new URL(url, base)))),
  } as Parameters<typeof provide>[0]

  provide(impl)

  const base = import.meta.url
  const location = './translation-store.test.ts--filesystem/import-extends/i18n.json'
  const json = await impl.importI18nJson(location, base)

  const store = i18nTanslationStore()
  store.loadTranslations({
    location: new URL(location, base).toString(),
    languages: json,
  })

  await step('"importLanguage", load engish languages only once', async () => {
    await store.translationsFromLanguage('en')
    await store.translationsFromLanguage('en-US')
    await store.translationsFromLanguage('en-Latn-US')
    expect(importLanguageCalls).toEqual([{ url: store.data.languages.en.extends, base: store.data.location }])
  })

  await step('"en", should import & return english translations', async () => {
    expect(await store.translationsFromLanguage('en')).toEqual({
      'hello world': 'hello world',
      'I like red color': 'I like red color',
      'I will go in a bus': 'I will go in a bus',
    })
  })

  await step('"en-US", should still return english translations', async () => {
    expect(await store.translationsFromLanguage('en-US')).toEqual({
      'hello world': 'hello world',
      'I like red color': 'I like red color',
      'I will go in a bus': 'I will go in a bus',
    })
  })

  await step('"en-Latn-US", should still return english translations', async () => {
    expect(await store.translationsFromLanguage('en-Latn-US')).toEqual({
      'hello world': 'hello world',
      'I like red color': 'I like red color',
      'I will go in a bus': 'I will go in a bus',
    })
  })
})

test('Given a completed storeData, when getting translationsFromLanguage ', async ({ step, expect }) => {
  const store = i18nTanslationStore()
  const storeData = {
    location: '',
    languages: {
      en: {
        translations: {
          'hello world': 'hello world',
        },
      },
      pt: {
        translations: {
          'hello world': 'olá mundo',
        },
      },
      es: {
        translations: {
          'hello world': 'hola mundo',
        },
      },
    },
  }
  store.loadTranslations(storeData)
  const englishTranslations = storeData.languages.en.translations

  await step('"en", should return english translations', async () => {
    expect(await store.translationsFromLanguage('en')).toEqual(englishTranslations)
  })
  await step('"en-US", should still return english translations', async () => {
    expect(await store.translationsFromLanguage('en-US')).toEqual(englishTranslations)
  })
  await step('"en-Latn-US", should still return english translations', async () => {
    expect(await store.translationsFromLanguage('en-Latn-US')).toEqual(englishTranslations)
  })
})

test('Given a completed storeData with specific locales, when getting translationsFromLanguage ', async ({ step, expect }) => {
  const store = i18nTanslationStore()
  const storeData = {
    location: '',
    languages: {
      en: {
        translations: {
          'hello world': 'hello world',
          'I like red color': 'I like red color',
          'I will go in a bus': 'I will go in a bus',
        },
      },
      'en-GB': {
        translations: {
          'I like red color': 'I like red colour',
        },
      },
      pt: {
        translations: {
          'hello world': 'olá mundo',
          'I like red color': 'Gosto da cor vermelha',
          'I will go in a bus': 'Irei de autocarro',
        },
      },
      'pt-BR': {
        translations: {
          'I will go in a bus': 'Eu vou de ônibus',
        },
      },
      es: {
        translations: {
          'hello world': 'hola mundo',
          'I like red color': 'Me gusta la color roja',
          'I will go in a bus': 'Iré en un autobús',
        },
      },
    },
  }
  store.loadTranslations(storeData)
  const englishTranslations = storeData.languages.en.translations

  await step('"en", should return english translations', async () => {
    expect(await store.translationsFromLanguage('en')).toEqual(englishTranslations)
  })
  await step('"en-US", should still return english translations', async () => {
    expect(await store.translationsFromLanguage('en-US')).toEqual(englishTranslations)
  })
  await step('"en-GB", should return english translations with GB customization', async () => {
    expect(await store.translationsFromLanguage('en-UK')).toEqual({
      ...englishTranslations,
      'I like red color': 'I like red colour',
    })
  })
  await step('"en-Latn-GB", should still return english translations with GB customization', async () => {
    expect(await store.translationsFromLanguage('en-Latn-GB')).toEqual({
      ...englishTranslations,
      'I like red color': 'I like red colour',
    })
  })
})

function i18nImporterImplWith({ readFrom }: { readFrom: Parameters<Parameters<typeof test>[1]>[0]['readFrom'] }) {
  return {
    importI18nJson: async (url, base) => JSON.parse(await readFrom(new URL(url, base))),
    importTranslations: async (url, base) => JSON.parse(await readFrom(new URL(url, base))),
  } as Parameters<typeof provide>[0]
}
