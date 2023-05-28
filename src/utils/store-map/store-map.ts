import { i18nTanslationStore, type TranslationStore } from '../store/translation-store.ts'
import { traverseUpDom } from '../algorithms/traverse-up-dom.ts'

const fallbackStore = i18nTanslationStore()

type StoreSearchResult = {
  store: typeof fallbackStore
  element?: Element
}

export const noStoresFound = Object.freeze({
  store: fallbackStore,
}) as StoreSearchResult

const map: WeakMap<Element, TranslationStore> = new WeakMap()

export const setStoreFromElement = (element: HTMLElement, store: TranslationStore) => {
  map.set(element, store)
}

export const getStoresInfoFromElement = function* (target: Element) {
  for (const element of traverseUpDom(target)) {
    const store = map.get(element)
    if (store) yield { store, element }
  }
  yield noStoresFound
}
