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

  updateNodes() {
    const promises = [] as Promise<Element | null>[]
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
        const promise = translate(i18nKey, locale, element).then((result) => {
          if (element.getAttribute(attribute) === result) {
            return null
          } else {
            element.setAttribute(attribute, result)
            return element
          }
        })
        promises.push(promise)
      }
    }
    Promise.allSettled(promises).then((promises) => {
      const elementsUpdated = promises.map((promise) => promise.status === 'fulfilled' ? promise.value : null).filter((result) =>
        result != null
      ) as Element[]
      if (elementsUpdated.length <= 0) {
        return
      }
      const event = new CustomEvent('i18n-apply', { bubbles: true, detail: { elementsUpdated } })
      this.dispatchEvent(event)
    })
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

const attributePrefixPriority = {
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
    if (!previous || attributePrefixPriority[previous.prefix] < attributePrefixPriority[prefix]) {
      attributesToUpdate[attrName] = { prefix, value }
    }
  }
  return Object.fromEntries(Object.entries(attributesToUpdate).map(([key, val]) => [key, val.value]))
}

const contentAttributeDetails = (() => {
  const setTextContent = (element: Element, text: string) => element.textContent = text
  const setInnerHtml = (element: Element, text: string) => element.innerHTML = text
  return {
    'data-i18n-unsafe-html': {
      priority: 1,
      contentSetter: setInnerHtml
    },
    'data-i18n-html': {
      priority: 2,
      // TODO: sanitize html
      contentSetter: setInnerHtml
    },
    'data-i18n': {
      priority: 2,
      // TODO: sanitize html
      contentSetter: setTextContent
    },
    'data-i18n-text': {
      priority: 3,
      // TODO: sanitize html
      contentSetter: setTextContent
    }
  } as {
    [text: string]: {
      priority: number,
      contentSetter:  (element: Element, text: string) => void
    }
  }

})()

export default I18nContainerElement
