import { i18nTanslationStore, type TranslationStore } from '../store/translation-store.ts'
import { traverseUpDom } from '../algorithms/traverse-up-dom.ts'

const fallbackStore = i18nTanslationStore()
const map: WeakMap<Element, TranslationStore> = new WeakMap()

export const mapElementWithStore = (element: HTMLElement, store: TranslationStore) => {
  map.set(element, store)
}

export const setStoreFromElement = (element: HTMLElement, store: TranslationStore) => {
  map.set(element, store)
}

export const getStoresInfoFromElement = function* (target: Element) {
  for (const element of traverseUpDom(target)) {
    const elementStore = map.get(element)
    if (elementStore) {
      yield {
        store: elementStore,
        element,
      }
    }
  }
  yield {
    store: fallbackStore,
    element: null,
  }
}
