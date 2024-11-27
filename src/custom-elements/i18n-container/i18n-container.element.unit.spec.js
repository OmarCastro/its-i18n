import { test } from '../../../test-utils/unit/test.js'
import { provide } from '../../utils/i18n-importer/provider.js'
import { loadI18n } from '../../html-loader/html-loader.js'
import { setStoreFromElement } from '../../utils/store-map/store-map.js'
import assert from 'node:assert'

const html = String.raw

const tag = 'x-i18n'
let defineWebComponent = async () => {
  const module = await import('./i18n-container.element.js')
  window.customElements.define(tag, module.default)
  defineWebComponent = () => Promise.resolve()
}

/**
 * @param {Element} element
 */
const getPromiseFrom18nApplyEvent = (element) => {
  let resolve = () => {}
  /** @type {PromiseLike<void>} */
  const obj = {
    then: (newResolve) => { resolve = newResolve },
  }
  element.addEventListener('i18n-apply', () => resolve())
  return obj
}

test('Given an HTML page with i18n-translation-map links and es lang on body, x-i18n should apply spanish i18n to its chidren correctly', async ({ dom, expect }) => {
  await defineWebComponent()

  const { document } = dom
  const location = import.meta.url

  provide(i18nImporterImplFromLocation(new URL('.', import.meta.url).href))

  document.documentElement.innerHTML = html`
    <head>
      <link rel="i18n-locale-map" href="i18n-definition-map.json">
    </head>
    <body lang="es"></body>
  `

  const store = await loadI18n({ document, location })
  setStoreFromElement(document.documentElement, store)

  document.body.innerHTML = html`
<${tag} class="component">
  <span class="target-1" data-i18n="I counted 4 sheeps"></span>
</${tag}> 
`

  const component = document.body.querySelector('.component')
  assert(component != null)
  await getPromiseFrom18nApplyEvent(component)

  const target = document.querySelector('.target-1')
  assert(target != null)

  await expect(target.getAttribute('data-i18n')).toEqual('I counted 4 sheeps')
  await expect(target.textContent).toEqual('conté 4 ovejas')
})

test('Given an HTML page with i18n-translation-map links and "pt" lang on body and "en" lang on an elment, x-i18n should apply portuguese i18n to its chidren except the one with english lang', async ({ dom, expect }) => {
  await defineWebComponent()

  const { document } = dom
  const location = import.meta.url

  provide(i18nImporterImplFromLocation(new URL('.', import.meta.url).href))

  document.documentElement.innerHTML = html`
    <head>
      <link rel="i18n-locale-map" href="i18n-definition-map.json">
    </head>
    <body lang="pt"></body>
  `

  const store = await loadI18n({ document, location })
  setStoreFromElement(document.documentElement, store)

  document.body.innerHTML = html`
<${tag} class="component">
  <span class="target-1" data-i18n--data-html="I counted 20 sheeps"></span>
  <span class="target-1-en" lang="en" data-i18n--data-html="I counted 30 sheeps"></span>

</${tag}> 
`

  const component = document.body.querySelector('.component')
  assert(component != null)
  await getPromiseFrom18nApplyEvent(component)

  const target = document.querySelector('.target-1')
  const targetEn = document.querySelector('.target-1-en')
  assert(target != null && targetEn != null)

  await expect(target.getAttribute('data-html')).toEqual('contei 20 ovelhas')
  await expect(targetEn.getAttribute('data-html')).toEqual('I counted 30 sheeps')
})

test('Given an element with conflicting data-i18n-* attributes, x-i18n should apply the correct attribut based on its priority', async ({ dom, step, expect }) => {
  await defineWebComponent()

  const { document } = dom
  const location = import.meta.url

  provide(i18nImporterImplFromLocation(new URL('.', import.meta.url).href))

  document.documentElement.innerHTML = html`
    <head>
      <link rel="i18n-locale-map" href="i18n-definition-map.json">
    </head>
    <body lang="en"></body>
  `

  const store = await loadI18n({ document, location })
  setStoreFromElement(document.documentElement, store)

  document.body.innerHTML = html`
<${tag} class="component">
  <span class="target-1" data-i18n--data-attr="I counted 0 sheeps" data-i18n-attr-data-attr="I counted 4 sheeps"></span>
  <span class="target-2" data-i18n-attr-data-attr="I counted 2 sheeps" data-i18n-attribute-data-attr="I counted 0 sheeps"></span>
  <span class="target-3" data-i18n--data-attr="I counted 0 sheeps" data-i18n-attribute-data-attr="I counted 10 sheeps"></span>
  <span class="target-4" data-i18n--data-attr="I counted 6 sheeps" data-i18n-attr-data-attr="I counted 4 sheeps" data-i18n-attribute-data-attr="I counted 9 sheeps"></span>
</${tag}> 
`

  const component = document.body.querySelector('.component')
  assert(component != null)
  await getPromiseFrom18nApplyEvent(component)

  const target1 = document.querySelector('.target-1')
  const target2 = document.querySelector('.target-2')
  const target3 = document.querySelector('.target-3')
  const target4 = document.querySelector('.target-4')
  assert(target1 != null && target2 != null && target3 != null && target4 != null)

  await step('"data-i18n-attr-*" has higher priority than "data-i18n--*"', async () => {
    await expect(target1.getAttribute('data-attr')).toEqual('I counted 4 sheeps')
  })
  await step('"data-i18n-attribute-*" has higher priority than both "data-i18n-attr-*" and "data-i18n--*"', async () => {
    await expect({
      target2: target2.getAttribute('data-attr'),
      target3: target3.getAttribute('data-attr'),
      target4: target4.getAttribute('data-attr'),
    }).toEqual({
      target2: 'No sheeps found',
      target3: 'I counted 10 sheeps',
      target4: 'I counted 9 sheeps',
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
  'languages.en.json',
  'languages.es.json',
  'languages.it.json',
  'languages.pt.json',
])
const filesystemContents = Object.fromEntries(filesystem.map(path => [path, readJson(path)]))
