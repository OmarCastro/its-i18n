import '../utils/i18n-importer/implementation.js'
import { I18nContainerElement as Element } from '../custom-elements/i18n-container/i18n-container.element.js'
export { translate } from '../js-api/api.js'

const url = new URL(import.meta.url)
const elementName = url.searchParams.get('named')
if (elementName) {
  if (customElements.get(elementName) != null) {
    console.error(`A custom element with name "${elementName}" already exists`)
  } else {
    customElements.define(elementName, Element)
  }
}

export const I18nContainerElement = Element
export default I18nContainerElement
