import { test } from '../../test-utils/unit/test.js'
import { loadI18n } from './html-loader.js'
import { provide } from '../utils/i18n-importer/provider.js'

const html = String.raw

test('an HTML page with i18n-locale-map links, loadI18n should return a store', async ({ dom, step, expect }) => {
  const { document } = dom
  const location = import.meta.url

  document.documentElement.innerHTML = html`
    <head>
      <link rel="i18n-locale-map" href="i18n-definition-map.json">
    </head>
    <body>
      lorem ipsum
    <body>
  `

  const impl = i18nImporterImplFromLocation(new URL('.', import.meta.url).href)
  provide(impl)

  const store = await loadI18n({ document, location })

  const expectedTranslationsEN = {
    'hello world': 'hello world',
    'I like red color': 'I like red color',
    'I counted 0 sheeps': 'No sheeps found',
    'I counted 1 sheeps': 'I counted 1 sheep',
    'I counted {number} sheeps': 'I counted {0} sheeps',
  }

  const expectedTranslationsPT = {
    'hello world': 'olá mundo',
    'I like red color': 'Gosto da cor vermelha',
    'I counted 0 sheeps': 'nenhuma ovelha encontrada',
    'I counted 1 sheeps': 'contei 1 ovelha',
    'I counted {number} sheeps': 'contei {0} ovelhas',
  }

  const expectedTranslationsES = {
    'hello world': 'hola mundo',
    'I like red color': 'Me gusta la color roja',
    'I counted 0 sheeps': 'no se encontraron ovejas',
    'I counted 1 sheeps': 'conté 1 oveja',
    'I counted {number} sheeps': 'conté {0} ovejas',
  }

  await step('where "en" locale translations are loaded correctly ', async () => {
    expect(await store.translationsFromLanguage('en')).toEqual(expectedTranslationsEN)
  })

  await step('where "en-US" locale translations, while not being loaded, still gets from "en" locale ', async () => {
    expect(await store.translationsFromLanguage('en-US')).toEqual(expectedTranslationsEN)
  })

  await step(
    'where "en-UK" locale translations, while not being loaded and not being valid (it is en-GB), still gets from "en" locale ',
    async () => {
      expect(await store.translationsFromLanguage('en-UK')).toEqual(expectedTranslationsEN)
    }
  )

  await step('where "pt" locale translations are loaded correctly ', async () => {
    expect(await store.translationsFromLanguage('pt')).toEqual(expectedTranslationsPT)
  })

  await step('where "pt-BR" translations, while not being loaded, still gets from "pt" locale ', async () => {
    expect(await store.translationsFromLanguage('pt-BR')).toEqual(expectedTranslationsPT)
  })

  await step('where "es" locale translations are loaded correctly ', async () => {
    expect(await store.translationsFromLanguage('es')).toEqual(expectedTranslationsES)
  })
})

test('an HTML page with i18n-translation-map links, loadI18n should return a store', async ({ dom, step, expect }) => {
  const { document, location } = dom

  document.documentElement.innerHTML = html`
    <head>
      <link rel="i18n-translation-map" href="languages.pt.json" lang="pt">
      <link rel="i18n-translation-map" href="languages.es.json" lang="es">
      <link rel="i18n-translation-map" href="languages.it.json" lang="it">
      <link rel="i18n-translation-map" href="languages.en.json" lang="en">
    </head>
    <body>
      lorem ipsum
    <body>
  `

  provide({
    importDefinitionMap (url, base) {
      return Promise.resolve({})
    },
    importTranslations (url, base) {
      const href = new URL(url, base).href
      if (href.endsWith('languages.pt.json')) {
        return Promise.resolve({
          'hello world': 'olá mundo',
          'I like red color': 'Gosto da cor vermelha',
        })
      }

      if (href.endsWith('languages.es.json')) {
        return Promise.resolve({
          'hello world': 'hola mundo',
          'I like red color': 'Me gusta la color roja',
        })
      }

      if (href.endsWith('languages.it.json')) {
        return Promise.resolve({
          'hello world': 'Ciao mondo',
          'I like red color': 'Mi piace il colore rosso',
        })
      }

      if (href.endsWith('languages.en.json')) {
        return Promise.resolve({
          'hello world': 'hello world',
          'I like red color': 'I like red color',
        })
      }

      return Promise.resolve({})
    },
  })

  const store = await loadI18n({ document, location })

  await step('where "en" locale translations are loaded correctly ', async () => {
    expect(await store.translationsFromLanguage('en')).toEqual({
      'hello world': 'hello world',
      'I like red color': 'I like red color',
    })
  })

  await step('where "en-US" locale translations, while not being loaded, still gets from "en" locale ', async () => {
    expect(await store.translationsFromLanguage('en-US')).toEqual({
      'hello world': 'hello world',
      'I like red color': 'I like red color',
    })
  })

  await step(
    'where "en-UK" locale translations, while not being loaded and not being valid (it is en-GB), still gets from "en" locale ',
    async () => {
      expect(await store.translationsFromLanguage('en-UK')).toEqual({
        'hello world': 'hello world',
        'I like red color': 'I like red color',
      })
    }
  )

  await step('where "pt" locale translations are loaded correctly ', async () => {
    expect(await store.translationsFromLanguage('pt')).toEqual({
      'hello world': 'olá mundo',
      'I like red color': 'Gosto da cor vermelha',
    })
  })

  await step('where "pt-BR" translations, while not being loaded, still gets from "pt" locale ', async () => {
    expect(await store.translationsFromLanguage('pt-BR')).toEqual({
      'hello world': 'olá mundo',
      'I like red color': 'Gosto da cor vermelha',
    })
  })

  await step('where "es" locale translations are loaded correctly ', async () => {
    expect(await store.translationsFromLanguage('es')).toEqual({
      'hello world': 'hola mundo',
      'I like red color': 'Me gusta la color roja',
    })
  })

  await step('where "it" locale translations are loaded correctly ', async () => {
    expect(await store.translationsFromLanguage('it')).toEqual({
      'hello world': 'Ciao mondo',
      'I like red color': 'Mi piace il colore rosso',
    })
  })
})

/**
 *
 * @param {string} locHref
 */
const i18nImporterImplFromLocation = (locHref) => {
  /**
   * @param {string | URL} url
   * @param {string | URL} base
   */
  function importFile (url, base) {
    const href = new URL(url, base).href
    if (!href.startsWith(locHref)) { throw Error(`${href} not found from ${locHref}`) }
    const file = /** @type {filesystem[number]} */(href.slice(locHref.length))
    if (filesystem.includes(file)) {
      return filesystemContents[file]
    }
    throw Error(`${href} mapped to ${file} not found`)
  }
  return { importDefinitionMap: importFile, importTranslations: importFile }
}

const fsDir = new URL(import.meta.url).pathname + '--filesystem'
/**
 * @param {string} path
 */
const readJson = async (path) => {
  const { readFile } = await import('node:fs/promises')
  const { join } = await import('node:path')
  return await readFile(join(fsDir, path), { encoding: 'utf8' }).then(JSON.parse)
}
const filesystem = /** @type {const} */([
  'i18n-definition-map.json',
  'definition-map-in-folder/i18n-definition-map.json',
  'languages.en.json',
  'languages.es.json',
  'languages.it.json',
  'languages.pt.json',
])
const filesystemContents = Object.fromEntries(filesystem.map(path => [path, readJson(path)]))
