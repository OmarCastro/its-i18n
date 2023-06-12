import { eventName, observeLangFromElement } from '../../utils/algorithms/observe-lang-from-element.util.ts'
import { getLanguageFromElement } from '../../utils/algorithms/get-lang-from-element.util.ts'
import { getStoresInfoFromElement } from '../../utils/store-map/store-map.ts'
import { queryFromTranslations } from '../../utils/translation-query/translation-query.util.js'
import { sanitizeI18nHtml } from '../../utils/html-sanitizer/html-sanitizer.js'

class I18nContainerElement extends HTMLElement {
  constructor() {
    super()
    observeLangFromElement(this)
    this.addEventListener(eventName, () => this.updateNodes())
    observer.observe(this, mutationProperties)
  }

  connectedCallback() {
    this.updateNodes()
  }

  updateNodes() {
    return updateI18nOnElements(this.querySelectorAll('*')).then((elementsUpdated) => {
      const result = { elementsUpdated }

      if (elementsUpdated.length <= 0) {
        return result
      }

      const event = new CustomEvent('i18n-apply', { bubbles: true, detail: result })
      this.dispatchEvent(event)
      return result
    })
  }
}

function updateI18nOnElements(iterable: Iterable<Element>) {
  const promises = [] as Promise<Element | null>[]
  for (const element of iterable) {
    if (!element.hasAttributes()) {
      continue
    }
    const attributesToUpdate = getAttributesToUpdate(element)
    const attributeEntries = Object.entries(attributesToUpdate)
    const contentDetails = getContentDetailsToUpdate(element)
    if (attributeEntries.length <= 0 && contentDetails === notFoundContentDetails) {
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
    if (contentDetails !== notFoundContentDetails) {
      const promise = translate(contentDetails.key, locale, element).then((result) => {
        const previousHtml = element.innerHTML
        contentDetails.contentSetter(element, result)
        return previousHtml === element.innerHTML ? null : element
      })
      promises.push(promise)
    }
  }

  return Promise.allSettled(promises).then((promises) => {
    return promises
      .map((promise) => promise.status === 'fulfilled' ? promise.value : null)
      .filter((result) => result != null) as Element[]
  })
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

const dataI18nAttributeMatchRegex = /^(data\-i18n\-(?:attr)?(?:ibute)?-)(.*)$/

function getAttributesToUpdate(element: Element): { [k: string]: string } {
  const attributesToUpdate = {} as { [k: string]: { prefix: string; value: string } }
  for (const attribute of element.attributes) {
    const { name, value } = attribute
    const match = name.match(dataI18nAttributeMatchRegex)
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

type ElementContentSetter = (element: Element, text: string) => void

const contentAttributeDetails = (() => {
  const setTextContent = (element: Element, text: string) => element.textContent = text
  const setInnerHtml = (element: Element, text: string) => element.innerHTML = text
  const setSanitizedHtml = (element: Element, text: string) => element.innerHTML = sanitizeI18nHtml(text).html
  return {
    'data-i18n-unsafe-html': {
      priority: 1,
      contentSetter: setInnerHtml,
    },
    'data-i18n-html': {
      priority: 2,
      contentSetter: setSanitizedHtml,
    },
    'data-i18n': {
      priority: 2,
      contentSetter: setTextContent,
    },
    'data-i18n-text': {
      priority: 3,
      contentSetter: setTextContent,
    },
  } as {
    [text: string]: {
      priority: number
      contentSetter: ElementContentSetter
    }
  }
})()

const orderedContentAttributeDetails = Object.entries(contentAttributeDetails)
  .map(([attribute, info]) => ({ ...info, attribute }))
  .sort((a, b) => b.priority - a.priority)

const notFoundContentDetails = Object.freeze({
  attribute: '',
  key: '',
  priority: 0,
  contentSetter: () => {},
})

function getContentDetailsToUpdate(element: Element): typeof orderedContentAttributeDetails[number] & { key: string } {
  for (const detail of orderedContentAttributeDetails) {
    const { attribute } = detail
    if (element.hasAttribute(attribute)) {
      return {
        ...detail,
        key: element.getAttribute(attribute)!,
      }
    }
  }
  return notFoundContentDetails
}

const targetsToUpdateI18n = {
  elements: new Set() as Set<Element>,
  subtrees: new Set() as Set<Element>,
}

let frameRequestNumber: number | undefined = undefined
const triggerUpdate = () => {
  const { elements, subtrees } = targetsToUpdateI18n
  if (elements.size === 0 && subtrees.size === 0) {
    return
  }

  const subTreeTargets = [...subtrees].flatMap((root) => [...root.querySelectorAll('*')])
  const targets = [...elements, ...subTreeTargets]
  elements.clear()
  subtrees.clear()
  frameRequestNumber = undefined
  updateI18nOnElements(new Set(targets))
}

const observer = new MutationObserver((records) => {
  for (const record of records) {
    const { target, type } = record

    if (!(target instanceof Element) || type !== 'attributes') {
      continue
    }

    const { attributeName } = record
    if (!attributeName) continue
    if (record.oldValue === target.getAttribute(attributeName)) continue
    if (attributeName === 'lang') {
      targetsToUpdateI18n.elements.add(target)
      targetsToUpdateI18n.subtrees.add(target)
    } else if (Object.hasOwn(contentAttributeDetails, attributeName) || attributeName.match(dataI18nAttributeMatchRegex)) {
      targetsToUpdateI18n.elements.add(target)
    }
    if(!frameRequestNumber){
      frameRequestNumber = requestAnimationFrame(triggerUpdate)
    }
})

const mutationProperties = Object.freeze({ attributes: true, subtree: true } as MutationObserverInit)

export default I18nContainerElement
