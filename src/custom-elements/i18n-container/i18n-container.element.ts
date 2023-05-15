import { eventName, observeLangFromElement } from '../../utils/algorithms/observe-lang-from-element.util.ts'
import { loadI18n } from '../../html-loader/html-loader.ts'

class I18nContainerElement extends HTMLElement {
  constructor() {
    super()
    observeLangFromElement(this)
    this.addEventListener(eventName, () => {
    })
  }

  connectedCallback() {
  }

  updateNodes() {
    for (const element of this.querySelectorAll('*')) {
      const lang = null
      if (!element.hasAttributes()) {
        continue
      }
      const attributesToUpdate = getAttributesToUpdate(element)

      for (const [attribute, i18nKey] of Object.entries(attributesToUpdate)) {
        element.setAttribute(attribute, translate(i18nKey))
      }
    }
    this.querySelectorAll('*').forEach((node) => {
      node.attributes.getNamedItem
    })
  }
}

function translate(text: string) {
  console.warn('TODO: text translation')
  return text
}

const prefixPriority = {
  'data-i18n--': 1,
  'data-i18n-attr-': 2,
  'data-i18n-attribute-': 3,
}
function getAttributesToUpdate(element: Element): { [k: string]: string } {
  const attributesToUpdate = {} as { [k: string]: { prefix: string; value: string } }
  for (const attribute of element.attributes) {
    const { name, value } = attribute
    const match = name.match(/^(data\-i18n\-(?:attr)?(?:ibute)?-)(.*)$/)
    if (!match) {
      continue
    }
    const [, prefix, attrName] = match
    const previous = attributesToUpdate[attrName]
    if (!previous || prefixPriority[previous.prefix] < prefixPriority[prefix]) {
      attributesToUpdate[attrName] = { prefix, value }
    }
  }
  return Object.fromEntries(Object.entries(attributesToUpdate).map(([key, val]) => [key, val.value]))
}

export default I18nContainerElement
