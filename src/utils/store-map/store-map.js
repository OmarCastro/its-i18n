import { i18nTanslationStore } from '../store/translation-store.js'
import { traverseUpDom } from '../algorithms/traverse-up-dom.js'

const fallbackStore = i18nTanslationStore()

/** @type {StoreSearchResult} */
export const noStoresFound = Object.freeze({
  store: fallbackStore,
})

/** @type {StoreMap} */
const map = new WeakMap()

/**
 * Remove assigned store from element
 * @param {Element} element - target element
 */
export const unsetStoreOnElement = (element) => {
  map.delete(element)
}

/**
 * @param {Element} element - target element
 * @returns {boolean} true if there is a translation store assigned on `element`, false otherwise
 */
export const isStoreSetOnElement = function (element) {
  return map.has(element)
}

/**
 * Assigns a {@link TranslationStore} to an element, overwrites previous if already assigned
 * @param {Element} element - target element
 * @param {TranslationStore} store - store to assign
 */
export const setStoreFromElement = (element, store) => {
  map.set(element, store)
}

/**
 * Gets stores assigned and inherited from the element
 * @param {Element} target - target Element
 * @yields {StoreSearchResult}
 */
export const getStoresInfoFromElement = function * (target) {
  for (const element of traverseUpDom(target)) {
    const store = map.get(element)
    if (store) yield { store, element }
  }
  yield noStoresFound
}

/**
 * @typedef {WeakMap<Element, TranslationStore>} StoreMap
 */

/**
 * @typedef {object} StoreSearchResult
 *
 * Result of {@link getStoresInfoFromElement}
 * @property {TranslationStore} store - store found, or fallback store
 * @property {Element} [element] element where the store is assigned
 */

/**
 * @typedef {import('../store/translation-store.js').TranslationStore} TranslationStore
 */
