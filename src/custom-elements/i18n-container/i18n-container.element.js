import { eventName, observeLangFromElement } from '../../utils/algorithms/observe-lang-from-element.util.js'
import { getLanguageFromElement } from '../../utils/algorithms/get-lang-from-element.util.js'
import { isElementTranslatable } from '../../utils/algorithms/get-translate-from-element.util.js'
import { getStoresInfoFromElement, setStoreFromElement } from '../../utils/store-map/store-map.js'
import { queryFromTranslations } from '../../utils/translation-query/translation-query.util.js'
import { sanitizeI18nHtml } from '../../utils/html-sanitizer/html-sanitizer.js'
import { timeTick } from '../../utils/tick-time/tick-time.js'
import { loadI18n } from '../../html-loader/html-loader.js'

export class I18nContainerElement extends HTMLElement {
  constructor () {
    super()
    observeLangFromElement(this)
    this.addEventListener(eventName, () => this.updateNodes())
    observer.observe(this, mutationProperties)

    const document = this.ownerDocument
    const stores = Array.from(getStoresInfoFromElement(document.documentElement))
    if (stores.length >= 2) {
      return
    }
    const window = document.defaultView
    if (!window) {
      return
    }

    loadI18n(window).then((store) => {
      setStoreFromElement(document.documentElement, store)
      if (this.isConnected) {
        this.updateNodes()
      }
    })
  }

  connectedCallback () {
    this.updateNodes()
  }

  updateNodes () {
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

/**
 *
 * @param {Iterable<Element>} iterable
 * @returns {Promise<Element[]>}
 */
function updateI18nOnElements (iterable) {
  const promises = []
  for (const element of iterable) {
    if (!isElementTranslatable(element) || !element.hasAttributes()) {
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

    const isTicking = element.hasAttribute('data-i18n-tick-time')
    if (isTicking) {
      timeTick().tickElement(element)
    }
  }

  return Promise.allSettled(promises).then((promises) => promises.flatMap((promise) => {
    if (promise.status === 'fulfilled' && promise.value) {
      return [promise.value]
    }
    return []
  }),
  )
}

/**
 * Translte the text content
 * @param {string} text - target text
 * @param {Intl.Locale} locale - language to translate to
 * @param {Element} context - the element where the translation is done
 * @returns {Promise<string>} translated text
 */
async function translate (text, locale, context) {
  for (const storeInfo of getStoresInfoFromElement(context)) {
    const result = queryFromTranslations(text, await storeInfo.store.translationsFromLanguage(locale))
    if (result.found) {
      return result.translate(locale)
    }
  }
  return text
}

/** @type  {{ [k: string]: number }} */
const attributePrefixPriority = {
  'data-i18n--': 1,
  'data-i18n-attr-': 2,
  'data-i18n-attribute-': 3,
}

const dataI18nAttributeMatchRegex = /^(data-i18n-(?:attr(?:ibute)?)?-)(.*)$/

/**
 *
 * @param {Element} element
 * @returns {{ [k: string]: string }}
 */
function getAttributesToUpdate (element) {
  /** @type {{ [k: string]: { prefix: string; value: string } }} */
  const attributesToUpdate = {}
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

const contentAttributeDetails = (() => {
  /** @type {ElementContentSetter} */
  function setTextContent (element, text) { element.textContent = text }
  /** @type {ElementContentSetter} */
  function setInnerHtml (element, text) { element.innerHTML = text }
  /** @type {ElementContentSetter} */
  function setSanitizedHtml (element, text) { element.innerHTML = sanitizeI18nHtml(text).html }

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

/**
 *
 * @param {Element} element
 * @returns {typeof orderedContentAttributeDetails[number] & { key: string }}
 */
function getContentDetailsToUpdate (element) {
  for (const detail of orderedContentAttributeDetails) {
    const { attribute } = detail
    const key = element.getAttribute(attribute)
    if (key != null) {
      return {
        ...detail,
        key,
      }
    }
  }
  return notFoundContentDetails
}

const targetsToUpdateI18n = {
  /** @type {Set<Element>} */
  elements: new Set(),
  /** @type {Set<Element>} */
  subtrees: new Set(),
}

function triggerUpdate () {
  const { elements, subtrees } = targetsToUpdateI18n
  if (elements.size === 0 && subtrees.size === 0) {
    return
  }

  const subTreeTargets = [...subtrees].flatMap((root) => [...root.querySelectorAll('*')])
  const targets = new Set([...elements, ...subTreeTargets])
  elements.clear()
  subtrees.clear()
  updateI18nOnElements(targets)
}

/** @type {number | undefined} */
let frameRequestNumber

/**
 *
 * @param {MutationRecord[]} records
 */
function observerCallback (records) {
  const { elements, subtrees } = targetsToUpdateI18n
  for (const record of records) {
    const { target, type } = record

    if (!(target instanceof Element) || type !== 'attributes') {
      continue
    }

    const { attributeName } = record
    if (!attributeName) continue
    if (record.oldValue === target.getAttribute(attributeName)) continue
    if (attributeName === 'lang') {
      elements.add(target)
      subtrees.add(target)
    } else if (Object.hasOwn(contentAttributeDetails, attributeName) || attributeName.match(dataI18nAttributeMatchRegex)) {
      elements.add(target)
    }
  }

  if (frameRequestNumber === undefined && (elements.size > 0 || subtrees.size > 0)) {
    frameRequestNumber = requestAnimationFrame(() => {
      frameRequestNumber = undefined
      triggerUpdate()
    })
  }
}

timeTick().addCallback(({ untick, targets }) => {
  const validTargets = targets.filter((target) => {
    const isTicking = target.hasAttribute('data-i18n-tick-time')
    if (!isTicking) {
      untick(target)
    }
    return isTicking
  })
  updateI18nOnElements(validTargets)
})

const observer = new MutationObserver(observerCallback)

/** @type {MutationObserverInit} */
const mutationProperties = Object.freeze({ attributes: true, subtree: true })

export default I18nContainerElement

/** @typedef { (element: Element, text: string) => void} ElementContentSetter */
