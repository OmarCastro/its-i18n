import { ElementLangObserver } from '../../element-lang-observer/element-lang-observer.util.js'
import { getLanguageFromElement } from '../../utils/algorithms/get-lang-from-element.util.js'
import { isElementTranslatable } from '../../utils/algorithms/get-translate-from-element.util.js'
import { getStoresInfoFromElement, setStoreFromElement, isStoreSetOnElement } from '../../utils/store-map/store-map.js'
import { queryFromTranslations } from '../../utils/translation-query/translation-query.util.js'
import { sanitizeI18nHtml } from '../../utils/html-sanitizer/html-sanitizer.js'
import { timeTick } from '../../utils/tick-time/tick-time.js'
import { loadI18n } from '../../html-loader/html-loader.js'

/** @type {ReturnType<typeof loadI18n>} */
let loadingPromise
const pendingElements = new WeakSet()

export class I18nContainerElement extends HTMLElement {
  constructor () {
    super()
    langObserver.observe(this)
    mutationObserver.observe(this, mutationProperties)

    const document = this.ownerDocument
    if (isStoreSetOnElement(document.documentElement)) {
      return
    }
    const window = document.defaultView
    if (!window) {
      return
    }

    if (!loadingPromise) {
      loadingPromise = loadI18n(window)
    }

    pendingElements.add(this)
    loadingPromise.then((store) => {
      setStoreFromElement(document.documentElement, store)
      if (this.isConnected) {
        this.updateNodes()
        pendingElements.delete(this)
      }
    })
  }

  connectedCallback () {
    if (!pendingElements.has(this)) {
      this.updateNodes()
    }
  }

  updateNodes () {
    return updateI18nOnElements(this.querySelectorAll('*')).then((elementsUpdated) => {
      const result = { elementsUpdated }

      if (elementsUpdated.size <= 0) {
        return result
      }

      const event = new CustomEvent('i18n-apply', { bubbles: true, detail: result })
      this.dispatchEvent(event)
      return result
    })
  }
}

/**
 * @param {Element} element - target element
 * @param {Intl.Locale} locale - locale to translate attributes
 * @param {[string, string][]} attributeEntries - attribute entries found in {@link getAttributesToUpdate}
 * @returns {Promise<Element | null>[]} list of promises of element attribute changes
 */
function applyI18nAttributesUpdate (element, locale, attributeEntries) {
  const promises = /** @type {Promise<Element | null>[]} */([])
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
  return promises
}

/**
 * @param {Element} element - target element
 * @param {Intl.Locale} locale - locale to translate attributes
 * @param {typeof orderedContentAttributeDetails[number] & { key: string }} contentDetails - content details applied on {@link getContentDetailsToUpdate}
 * @returns {Promise<Element | null>[]} list of promises of element content changes
 */
function applyI18nContentUpdate (element, locale, contentDetails) {
  if (contentDetails === notFoundContentDetails) {
    return []
  }
  const promise = translate(contentDetails.key, locale, element).then((result) => {
    const previousHtml = element.innerHTML
    contentDetails.contentSetter(element, result)
    return previousHtml === element.innerHTML ? null : element
  })
  return [promise]
}

/**
 *
 * @param {Element} element  - target element
 * @returns {Promise<Element | null>[]} - list of promises of element attribute and content changes
 */
function updateI18nOnElement (element) {
  if (!isElementTranslatable(element) || !element.hasAttributes()) {
    return []
  }
  const attributesToUpdate = getAttributesToUpdate(element)
  const attributeEntries = Object.entries(attributesToUpdate)
  const contentDetails = getContentDetailsToUpdate(element)
  if (attributeEntries.length <= 0 && contentDetails === notFoundContentDetails) {
    return []
  }
  const locale = new Intl.Locale(getLanguageFromElement(element))
  const promises = [
    ...applyI18nAttributesUpdate(element, locale, attributeEntries),
    ...applyI18nContentUpdate(element, locale, contentDetails),
  ]

  if (element.hasAttribute('data-i18n-tick-time')) {
    timeTick().tickElement(element)
  }
  return promises
}

/**
 * @param {Iterable<Element>} iterable - collection of element to update i18n
 * @returns {Promise<Set<Element>>} - promise of elements with i18n changes
 */
function updateI18nOnElements (iterable) {
  const promises = []
  for (const element of iterable) {
    promises.push(...updateI18nOnElement(element))
  }

  return Promise.allSettled(promises).then((promises) => {
    const elements = promises.flatMap(promise => promise.status === 'fulfilled' && promise.value ? [promise.value] : [])
    return new Set(elements)
  })
}

/**
 * Translates the `text` content
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
 * @param {Element} element - target element
 * @returns {{ [k: string]: string }} map of attribute name with i18n keys to update on `element`
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
 * @param {Element} element  - target element
 * @returns {typeof orderedContentAttributeDetails[number] & { key: string }} content detail to update on element
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

/**
 * Trigger update on all element targets to update i18n, it will run at most once per frame
 */
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

/**
 * @param {MutationRecord[]} records - mutation records of {@link I18nContainerElement} mutationObserver
 * @returns {typeof targetsToUpdateI18n} element and DOM subtree targets to update i18n content
 */
function fillTargetsToUpdate (records) {
  const { elements, subtrees } = targetsToUpdateI18n
  for (const record of records) {
    const { target, type, attributeName, oldValue } = record

    if (!(target instanceof Element) || type !== 'attributes' || !attributeName || oldValue === target.getAttribute(attributeName)) {
      continue
    }

    if (attributeName === 'lang') {
      elements.add(target)
      subtrees.add(target)
    } else if (Object.hasOwn(contentAttributeDetails, attributeName) || attributeName.match(dataI18nAttributeMatchRegex)) {
      elements.add(target)
    }
  }
  return targetsToUpdateI18n
}

/** @type {number | undefined} */
let frameRequestNumber

/**
 * @param {MutationRecord[]} records - mutation records of {@link I18nContainerElement} mutationObserver
 */
function observerCallback (records) {
  const { elements, subtrees } = fillTargetsToUpdate(records)

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

const mutationObserver = new MutationObserver(observerCallback)
const langObserver = new ElementLangObserver(records => {
  records.forEach(record => {
    if (record.target instanceof I18nContainerElement) {
      record.target.updateNodes()
    }
  })
})

/** @type {MutationObserverInit} */
const mutationProperties = Object.freeze({ attributes: true, attributesOldValue: true, subtree: true })

export default I18nContainerElement

/** @typedef { (element: Element, text: string) => void} ElementContentSetter */
