import { eventName, observeLangFromElement } from '../../utils/algorithms/observe-lang-from-element.util.ts'
import { getLanguageFromElement } from '../../utils/algorithms/get-lang-from-element.util.ts'
import { getStoresInfoFromElement } from '../../utils/store-map/store-map.ts'
import { queryFromTranslations } from '../../utils/translation-query/translation-query.util.ts'

class I18nContainerElement extends HTMLElement {
  constructor() {
    super()
    observeLangFromElement(this)
    this.addEventListener(eventName, () => this.updateNodes())
  }

  connectedCallback() {
    this.updateNodes()
  }

  async updateNodes() {
    for (const element of this.querySelectorAll('*')) {
      if (!element.hasAttributes()) {
        continue
      }
      const attributesToUpdate = getAttributesToUpdate(element)
      const attributeEntries = Object.entries(attributesToUpdate)
      if (attributeEntries.length <= 0) {
        continue
      }

      const locale = new Intl.Locale(getLanguageFromElement(element))

      for (const [attribute, i18nKey] of attributeEntries) {
        element.setAttribute(attribute, await translate(i18nKey, locale, element))
      }
    }
  }
}

async function translate(text: string, locale: Intl.Locale, context: Element) {
  for (const storeInfo of getStoresInfoFromElement(context)) {
    const result = queryFromTranslations(text, await storeInfo.store.translationsFromLanguage(locale))
    if (result.found) {
      return result.translate(locale)
    }
  }
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
