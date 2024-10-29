import { test } from '../../../test-utils/unit/test.js'
import { i18nTranslationStore } from './translation-store.js'
import { provide } from '../i18n-importer/provider.js'
/** @import {TestAPICall} from '../../../test-utils/unit/test.js' */
/** @import {Implementation} from '../i18n-importer/provider.js' */
/** @import {I18nDefinitionMap} from '../i18n-importer/i18n-importer.js' */

test('Given a new store, when loadTranslations ', async ({ step: originalStep, expect }) => {
  const translations = {
    'untranslated text': 'untranslated text',
  }

  /**
   * @param {I18nDefinitionMap} languages 
   */
  const storeDataWithLangs = (languages) => ({ location: 'http://example.com', languages })

  /** @type {{ error: any[], warn: any[] }} */
  const consoleCalls = { error: [], warn: [] }
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error
  console.warn = (...args) => {
    consoleCalls.warn.push(args)
  }

  console.error = (...args) => {
    consoleCalls.error.push(args)
  }

  /** @type {TestAPICall} */
  const step = async (...args) => {
    consoleCalls.error.length = 0
    consoleCalls.warn.length = 0
    return await originalStep.apply(null, args)
  }

  await step('with "en", "pt" & "es", should load wihout problems', async () => {
    const store = i18nTranslationStore()
    store.loadTranslations(storeDataWithLangs({
      en: { translations },
      pt: { translations },
      es: { translations },
    }))
    await expect(consoleCalls).toEqual({ error: [], warn: [] })
    await expect(Object.keys(store.data.languages)).toEqual(['en', 'pt', 'es'])
  })
  await step('with "en" & "en-US", should load wihout problems', async () => {
    const store = i18nTranslationStore()
    store.loadTranslations(storeDataWithLangs({
      en: { translations },
      'en-US': { translations },
    }))
    await expect(consoleCalls).toEqual({ error: [], warn: [] })
    await expect(Object.keys(store.data.languages)).toEqual(['en', 'en-US'])
  })
  await step('with "en" & "en-UK", should warn about invalid locale "en-UK" and fixes it to "en-GB"', async () => {
    const store = i18nTranslationStore()
    store.loadTranslations(storeDataWithLangs({
      en: { translations },
      'en-UK': { translations },
    }))
    expect(consoleCalls).toEqual({
      error: [],
      warn: [
        ['Warning on %s::%s, %s', 'http://example.com', '.["en-UK"]', 'invalid locale "en-UK", fixed to locale "en-GB"'],
      ],
    })
    await expect(Object.keys(store.data.languages)).toEqual(['en', 'en-GB'])
  })

  await step('with "en", "en-UK" & "en-GB", should log error of invalid & conflicting locale and should be discarded', async () => {
    const store = i18nTranslationStore()
    store.loadTranslations(storeDataWithLangs({
      en: { translations },
      'en-UK': { translations },
      'en-GB': { translations },
    }))
    await expect(consoleCalls).toEqual({
      error: [
        ['Error on %s::%s, %s', 'http://example.com', '.["en-UK"]', 'invalid locale "en-UK", it also conflicts with correct locale "en-GB", it will be ignored'],
      ],
      warn: [],
    })
    await expect(Object.keys(store.data.languages)).toEqual(['en', 'en-GB'])
  })

  await step(
    'with "en", "en-GB" & "en-ABC", should log error of invalid locale "en-ABC" and should discard only the invalid one',
    () => {
      const store = i18nTranslationStore()
      store.loadTranslations(storeDataWithLangs({
        en: { translations },
        'en-GB': { translations },
        'en-ABC': { translations },
      }))
      expect(consoleCalls).toEqual({
        error: [
          ['Error on %s::%s, %s', 'http://example.com', '.["en-ABC"]', 'invalid locale "en-ABC", it will be ignored'],
        ],
        warn: [],
      })
      expect(Object.keys(store.data.languages)).toEqual(['en', 'en-GB'])
    },
  )

  console.warn = originalConsoleWarn
  console.error = originalConsoleError
})

test('Given a new store, when loadTranslations from location', async ({ step: originalStep, expect }) => {
  /** @type {{ error: any[], warn: any[] }} */
  const consoleCalls = { error: [], warn: [] }
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error
  /** @type {typeof console.warn} */
  console.warn = (...args) => {
    consoleCalls.warn.push(args)
  }

  /** @type {typeof console.error} */
  console.error = (...args) => {
    consoleCalls.error.push(args)
  }

  /** @type {TestAPICall} */
  const step = async (...args) => {
    consoleCalls.error.length = 0
    consoleCalls.warn.length = 0
    return await originalStep.apply(null, args)
  }

  await step('from "import/i18n.json" should load wihout problems', async () => {
    const impl = i18nImporterImplFromLocation(new URL('.',import.meta.url).href)
    provide(impl)

    const base = import.meta.url
    const location = './import/i18n.json'
    const json = await impl.importDefinitionMap(location, base)

    const store = i18nTranslationStore()
    store.loadTranslations({
      location: new URL(location, base).pathname,
      languages: json,
    })
    expect(consoleCalls).toEqual({ error: [], warn: [] })
    expect(store.data.languages).toEqual({
      en: { import: ['./translations.en.json'], translations: {} },
      es: { import: ['./translations.es.json'], translations: {} },
      pt: { import: ['./translations.pt.json'], translations: {} },
    })
  })

  await step('from "import-outer/base/i18n.json" should load wihout problems', async () => {
    const impl = i18nImporterImplFromLocation(new URL('.',import.meta.url).href)
    provide(impl)

    const basePathFolder = './import-outer/base'
    const base = import.meta.url
    const location = `${basePathFolder}/i18n.json`
    const json = await impl.importDefinitionMap(location, base)

    const store = i18nTranslationStore()
    store.loadTranslations({
      location: new URL(location, base).pathname,
      languages: json,
    })
    expect(consoleCalls).toEqual({ error: [], warn: [] })
    expect(store.data.languages).toEqual({
      en: { import: ['../languages/en/translations.en.json'], translations: {} },
      es: { import: ['../languages/es/translations.es.json'], translations: {} },
      pt: { import: ['../languages/pt/translations.pt.json'], translations: {} },
    })
  })

  console.warn = originalConsoleWarn
  console.error = originalConsoleError
})

test('Given a storeData loaded from "import/i18n.json", when getting translationsFromLanguage ', async ({ step, expect }) => {
    /** @type {{ url: any, base: any }[]} */
  const importLanguageCalls = []
  const impl = i18nImporterImplFromLocation(new URL('.',import.meta.url).href)

  /** @type {typeof impl} */
  const mockImpl = {
    ...impl,
    importTranslations: async (url, base) => {
      importLanguageCalls.push({ url, base })
      return impl.importTranslations(url, base)
    },
  }

  provide(mockImpl)

  const base = import.meta.url
  const location = './import/i18n.json'
  const json = await impl.importDefinitionMap(location, base)

  const store = i18nTranslationStore()
  store.loadTranslations({
    location: new URL(location, base).toString(),
    languages: json,
  })

  await step('"importLanguage", load engish languages only once', async () => {
    await store.translationsFromLanguage('en')
    await store.translationsFromLanguage('en-US')
    await store.translationsFromLanguage('en-Latn-US')
    expect(importLanguageCalls).toEqual([{ url: json.en.import, base: store.data.location }])
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
  const store = i18nTranslationStore()
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
  const store = i18nTranslationStore()
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

/**
 * 
 * @param {string} locHref 
 * @returns {Implementation}
 */
const i18nImporterImplFromLocation = (locHref) => {
  /**
   * @param {string | URL} url 
   * @param {string | URL} base 
   * @returns {Promise<{[key:string]: any}>}
   */
  function importFile(url, base){
    const href = new URL(url, base).href
    if(!href.startsWith(locHref)){ throw Error(`${href} not found from ${locHref}`) }
    const file = href.substring(locHref.length)
    if(Object.hasOwn(filesystem, file)) { 
      return filesystem[/**@type {keyof typeof filesystem}*/(file)]
      
    }
    throw Error(`${href} mapped to ${file} not found`)
  }
  return { importDefinitionMap: importFile, importTranslations: importFile }
}



const filesystem = {
  get 'import/i18n.json' () { return import('./translation-store.unit.spect.ts--filesystem/import/i18n.json', { with: { type: 'json' }}).then(({ default: value }) => value) },
  get 'import/translations.en.json' () { return import('./translation-store.unit.spect.ts--filesystem/import/translations.en.json', { with: { type: 'json' }}).then(({ default: value }) => value) },
  get 'import/translations.es.json' () { return import('./translation-store.unit.spect.ts--filesystem/import/translations.es.json', { with: { type: 'json' }}).then(({ default: value }) => value) },
  get 'import/translations.pt.json' () { return import('./translation-store.unit.spect.ts--filesystem/import/translations.pt.json', { with: { type: 'json' }}).then(({ default: value }) => value) },

  get 'import-outer/base/i18n.json' () { return import('./translation-store.unit.spect.ts--filesystem/import-outer/base/i18n.json', { with: { type: 'json' }}).then(({ default: value }) => value) },
  get 'import-outer/languages/en/translations.en.json' () { return import('./translation-store.unit.spect.ts--filesystem/import-outer/languages/en/translations.en.json', { with: { type: 'json' }}).then(({ default: value }) => value) },
  get 'import-outer/languages/en/translations.es.json' () { return import('./translation-store.unit.spect.ts--filesystem/import-outer/languages/es/translations.es.json', { with: { type: 'json' }}).then(({ default: value }) => value) },
  get 'import-outer/languages/en/translations.pt.json' () { return import('./translation-store.unit.spect.ts--filesystem/import-outer/languages/pt/translations.pt.json', { with: { type: 'json' }}).then(({ default: value }) => value) },
}
