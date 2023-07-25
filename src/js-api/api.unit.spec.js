import { test } from '../../test-utils/unit/test.js'
import { provide } from '../utils/i18n-importer/provider.js'
import { i18n } from './api.js'
import { unsetStoreOnElement } from '../utils/store-map/store-map.js'

const html = String.raw

test('an HTML page with i18n-locale-map links, i18n should get values from the page', async ({ dom, step, expect }) => {
  const { document, location } = dom
  globalThis.document = document

  document.documentElement.innerHTML = html`
      <head>
        <link rel="i18n-locale-map" href="i18n-definition-map.json">
      </head>
      <body>
        lorem ipsum
      <body>
    `

  provide(i18nImporterImplFromLocation(location.href))

  await step('where "en" locale translations are loaded correctly ', async () => {
    expect(await i18n('hello world')).toEqual('hello world')
  })

  await step('where "en-US" locale translations, while not being loaded, still gets from "en" locale ', async () => {
    document.documentElement.setAttribute('lang', 'es')
    expect(await i18n('hello world')).toEqual('hola mundo')
  })

  delete globalThis.document
  unsetStoreOnElement(document.documentElement)
})

const i18nImporterImplFromLocation = (locHref) => {
  function importFile(url, base){
    const href = new URL(url, base).href
    if(!href.startsWith(locHref)){ throw Error(`${href} not found`) }
    const file = href.substring(locHref.length)
    if(!Object.hasOwn(filesystem, file)) { throw Error(`${href} mapped to ${file} not found`)  }
    return filesystem[file]
  }
  return { importI18nJson: importFile, importTranslations: importFile }
}

const filesystem = {
  get 'i18n-definition-map.json' () { return import('./api.unit.spec.js--filesystem/i18n-definition-map.json', { assert: { type: 'json' }}).then(({ default: value }) => value) },
  get 'languages.en.json' ()        { return import('./api.unit.spec.js--filesystem/languages.en.json',        { assert: { type: 'json' }}).then(({ default: value }) => value) },
  get 'languages.es.json' ()        { return import('./api.unit.spec.js--filesystem/languages.es.json',        { assert: { type: 'json' }}).then(({ default: value }) => value) },
  get 'languages.it.json' ()        { return import('./api.unit.spec.js--filesystem/languages.it.json',        { assert: { type: 'json' }}).then(({ default: value }) => value) },
  get 'languages.pt.json' ()        { return import('./api.unit.spec.js--filesystem/languages.pt.json',        { assert: { type: 'json' }}).then(({ default: value }) => value) },
}
