import { window } from '../../../test-utils/unit/init-dom.ts'
import { test } from '../../../test-utils/unit/test.ts'
import { provide } from '../../utils/i18n-importer/provider.ts'
import Element from './i18n-container.element.ts'

const html = String.raw

const tag = 'x-i18n'
let define = () => {
  window.customElements.define(tag, Element)
  define = () => {}
}

test('an HTML page with i18n-translation-map links, loadI18n should return a store', async ({ step, expect, readFrom }) => {
  //define()
  const { document } = window
  //const location = import.meta.url
  provide(i18nImporterImplWith({ readFrom }))

  document.documentElement.innerHTML = html`
    <head>
      <link rel="i18n-locale-map" href="i18n-container.element.test.ts--filesystem/i18n-definition-map.json">
    </head>
    <body>
      <${tag}>
        <span class="target-1" data-i18n--data-html="I counted 4 sheeps"></span>
      </${tag}> 
    <body>
  `

  await expect(document.querySelector('.target-1')?.getAttribute('data-i18n--data-html')).toEqual('I counted 4 sheeps')
})

function i18nImporterImplWith({ readFrom }: { readFrom: Parameters<Parameters<typeof test>[1]>[0]['readFrom'] }) {
  return {
    importI18nJson: async (url, base) => JSON.parse(await readFrom(new URL(url, base))),
    importTranslations: async (url, base) => JSON.parse(await readFrom(new URL(url, base))),
  } as Parameters<typeof provide>[0]
}
