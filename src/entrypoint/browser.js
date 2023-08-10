import '../utils/i18n-importer/implementation.js'
import { I18nContainerElement as Element } from '../custom-elements/i18n-container/i18n-container.element.js'
export { i18n } from '../js-api/api.js'
export { I18nContainerElement } from '../custom-elements/i18n-container/i18n-container.element.js'

const url = new URL(import.meta.url)
const elementName = url.searchParams.get('named')
if (elementName) {
  if (customElements.get(elementName) != null) {
    console.error(`A custom element with name "${elementName}" already exists`)
  } else {
    customElements.define(elementName, Element)
  }
}
