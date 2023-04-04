import { window } from '../../../test-utils/unit/init-dom.ts'
import { test } from '../../../test-utils/unit/test.ts'
import { loadI18n } from './implementation.ts'
import { provide } from '../i18n-importer/provider.ts'
import { normalizeI18nDefinitionMap } from '../i18n-normalizer/mod.ts'

const html = String.raw

test('an HTML page with i18n-translation-map links, loadI18n should return a store', async ({ step, expect }) => {
  const { document, location } = window

  document.documentElement.innerHTML = html`
    <head>
      <link rel="i18n-locale-map" href="definition.json">
    </head>
    <body>
      lorem ipsum
    <body>
  `

  provide({
    importI18nJson(url, base) {
      return Promise.resolve(
        normalizeI18nDefinitionMap({
          'en': 'languages.en.json',
          'es': 'languages.es.json',
          'it': 'languages.it.json',
          'pt': 'languages.pt.json',
        }).result,
      )
    },
    importTranslations(url, base) {
      if (url.endsWith('languages.pt.json')) {
        return Promise.resolve({
          'hello world': 'olá mundo',
          'I like red color': 'Gosto da cor vermelha',
        })
      }

      if (url.endsWith('languages.es.json')) {
        return Promise.resolve({
          'hello world': 'hola mundo',
          'I like red color': 'Me gusta la color roja',
        })
      }

      if (url.endsWith('languages.it.json')) {
        return Promise.resolve({
          'hello world': 'Ciao mondo',
          'I like red color': 'Mi piace il colore rosso',
        })
      }

      if (url.endsWith('languages.en.json')) {
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
    },
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

test('an HTML page with i18n-translation-map links, loadI18n should return a store', async ({ step, expect }) => {
  const { document, location } = window

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
    importI18nJson(url, base) {
      return Promise.resolve({})
    },
    importTranslations(url, base) {
      if (url.endsWith('languages.pt.json')) {
        return Promise.resolve({
          'hello world': 'olá mundo',
          'I like red color': 'Gosto da cor vermelha',
        })
      }

      if (url.endsWith('languages.es.json')) {
        return Promise.resolve({
          'hello world': 'hola mundo',
          'I like red color': 'Me gusta la color roja',
        })
      }

      if (url.endsWith('languages.it.json')) {
        return Promise.resolve({
          'hello world': 'Ciao mondo',
          'I like red color': 'Mi piace il colore rosso',
        })
      }

      if (url.endsWith('languages.en.json')) {
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
    },
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
