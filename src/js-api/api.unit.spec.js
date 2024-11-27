import { test } from '../../test-utils/unit/test.js'
import { translate } from './api.js'
import { i18nTranslationStore } from '../utils/store/translation-store.js'
import { unsetStoreOnElement } from '../utils/store-map/store-map.js'
import assert from 'node:assert'
import { provide } from '../utils/i18n-importer/provider.js'

const html = String.raw

test('Given an HTML page with i18n-locale-map links, i18n should get values from the page', async ({ dom, step, expect }) => {
  const { document, location } = dom
  globalThis.document = document
  unsetStoreOnElement(document.documentElement)

  document.documentElement.innerHTML = html`
      <head>
        <link rel="i18n-locale-map" href="i18n-definition-map.json">
      </head>
      <body>
        <canvas lang="it"></canvas>
        lorem ipsum
      <body>
    `

  const canvas = document.querySelector('canvas')
  assert(canvas != null)

  provide(i18nImporterImplFromLocation(location.href))

  await step('where "en" locale translations are loaded correctly ', async () => {
    expect(await translate('hello world')).toEqual('hello world')
  })

  await step('where "en-US" locale translations, while not being loaded, still gets from "en" locale ', async () => {
    document.documentElement.setAttribute('lang', 'es')
    expect(await translate('hello world')).toEqual('hola mundo')
  })

  await step('where locale translations defined on canvas are loaded correctly', async () => {
    expect(await translate('hello world', { element: canvas })).toEqual('ciao mondo')
  })

  await step('where specific locale translations loaded correctly', async () => {
    expect(await translate('hello world', { locale: 'pt' })).toEqual('olá mundo')
  })

  await step('and return same result if not found correctly', async () => {
    expect(await translate('not found', { locale: 'pt' })).toEqual('not found')
  })

  // @ts-ignore
  delete globalThis.document
  unsetStoreOnElement(document.documentElement)
})

test('Given an HTML page with i18n-locale-map links, i18n should load store when translating with custom locales', async ({ dom, step, expect }) => {
  const { document, location } = dom
  globalThis.document = document
  unsetStoreOnElement(document.documentElement)

  document.documentElement.innerHTML = html`
      <head>
        <link rel="i18n-locale-map" href="i18n-definition-map.json">
      </head>
      <body>
        <canvas lang="it"></canvas>
        lorem ipsum
      <body>
    `
  provide(i18nImporterImplFromLocation(location.href))
  expect(await translate('hello world', { locale: 'pt' })).toEqual('olá mundo')
  expect(await translate('not found', { locale: 'pt' })).toEqual('not found')

  // @ts-ignore
  delete globalThis.document
  unsetStoreOnElement(document.documentElement)
})

test('Given a store, translate() should search only from that store', async ({ dom, step, expect }) => {
  const location = 'http://localhost/'

  provide(i18nImporterImplFromLocation(location))
  const store = i18nTranslationStore()
  store.loadTranslations({
    location: location + 'i18n-definition-map.json',
    languages: await filesystemContents['i18n-definition-map.json']
  })
  expect(await translate('hello world', { locale: 'pt', store })).toEqual('olá mundo')
  expect(await translate('not found', { locale: 'pt', store })).toEqual('not found')

  // @ts-ignore
  delete globalThis.document
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
  'languages.en.json',
  'languages.es.json',
  'languages.it.json',
  'languages.pt.json',
])
const filesystemContents = Object.fromEntries(filesystem.map(path => [path, readJson(path)]))
