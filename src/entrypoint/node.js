import '../utils/i18n-importer/implementation.js'
import I18nElement from '../custom-elements/i18n-container/i18n-container.element.js'

const url = new URL(import.meta.url)
const elementName = url.searchParams.get('named')
if (elementName) {
  if (customElements.get(elementName) != null) {
    console.error(`A custom element with name "${elementName}" already exists`)
  } else {
    customElements.define(elementName, I18nElement)
  }
}
