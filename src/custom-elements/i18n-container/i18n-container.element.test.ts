import { window } from '../../../test-utils/unit/init-dom.ts'
import { test } from '../../../test-utils/unit/test.ts'
import { provide } from '../../utils/i18n-importer/provider.ts'
import { loadI18n } from '../../html-loader/html-loader.ts'
import { setStoreFromElement } from '../../utils/store-map/store-map.ts'

const html = String.raw

const tag = 'x-i18n'
let defineWebComponent = async () => {
  const module = await import('./i18n-container.element.ts')
  window.customElements.define(tag, module.default)
  defineWebComponent = () => Promise.resolve()
}

function getPromiseFromEvent(item, event) {
  let func: unknown = () => {}
  const obj = {
    then: (newFunc) => {
      func = newFunc
    },
  } as PromiseLike<void>
  item.addEventListener(event, () => (func as CallableFunction)())
  return obj
}

const getPromiseFrom18nApplyEvent = (item) => getPromiseFromEvent(item, 'i18n-apply')

test('an HTML page with i18n-translation-map links, x-i18n should apply i18n to its chidren correctly', async ({ step, expect, readFrom }) => {
  await defineWebComponent()

  const { document } = window
  const location = import.meta.url

  provide(i18nImporterImplWith({ readFrom }))

  document.documentElement.innerHTML = html`
    <head>
      <link rel="i18n-locale-map" href="i18n-container.element.test.ts--filesystem/i18n-definition-map.json">
    </head>
    <body lang="es"></body>
  `

  const store = await loadI18n({ document, location })
  setStoreFromElement(document.documentElement, store)

  document.body.innerHTML = html`
<${tag} class="component">
  <span class="target-1" data-i18n--data-html="I counted 4 sheeps"></span>
</${tag}> 
`

  const component = document.body.querySelector('.component')!
  await getPromiseFrom18nApplyEvent(component)

  const target = document.querySelector('.target-1')!

  await expect(target.getAttribute('data-i18n--data-html')).toEqual('I counted 4 sheeps')
  await expect(target.getAttribute('data-html')).toEqual('conté 4 ovejas')
})

function i18nImporterImplWith({ readFrom }: { readFrom: Parameters<Parameters<typeof test>[1]>[0]['readFrom'] }) {
  return {
    importI18nJson: async (url, base) => JSON.parse(await readFrom(new URL(url, base))),
    importTranslations: async (url, base) => JSON.parse(await readFrom(new URL(url, base))),
  } as Parameters<typeof provide>[0]
}
