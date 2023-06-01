import I18nElement from '../custom-elements/i18n-container/i18n-container.element.ts'

const url = new URL(import.meta.url)
const elementName = url.searchParams.get('named')
if (elementName) {
  if (customElements.get(elementName) != null) {
    console.error(`A custom element with name "${elementName}" already exists`)
  } else {
    customElements.define(elementName, I18nElement)
  }
}

export default I18nElement
