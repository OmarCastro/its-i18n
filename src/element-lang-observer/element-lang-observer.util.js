import { getLanguageFromElement } from '../utils/algorithms/get-lang-from-element.util.js'
import { IterableWeakMap, IterableWeakSet } from '../utils/algorithms/iterable-weak-struct.js'

/** @type {IterableWeakMap<Node, ObserveInfomation>} */
const rootNodes = new IterableWeakMap()

const data = Symbol('ElementLangObserverData')

/** @type {WeakMap<Element, {currentLang: string, observers: Set<ElementLangObserver>}>} */
const observingElementsInfo = new WeakMap()

export const domRootLangDispatchListener = {
  /**
   * @param {Element | Document} target - root target
   * @param {EventListenerOrEventListenerObject} callback - callback
   * @param {boolean | AddEventListenerOptions} options - listener options
   * @returns {{removeListener: () => void}} event listener
   */
  onDispatchOnRoot: (target, callback, options) => {
    target.addEventListener(rootEventName, callback, options)
    return {
      removeListener: () => target.removeEventListener(rootEventName, callback, options),
    }
  },
}

export const rootEventName = 'lang-change-dispatched'

export class ElementLangObserver {
  /**
   * @param {ElementLangObserverHandler} callback - handler callback
   */
  constructor (callback) {
    this[data] = {
      callback,
    }
  }

  /** @param {Element} element - element target to observe */
  observe (element) {
    observeLangFromElement(element, this)
  }

  /** @param {Element} element - element target to stop observing */
  unobserve (element) {
    unobserveLangFromElement(element, this)
  }
}

/**
 * @type {MutationObserverInit}
 */
const mutationProperties = Object.freeze({
  attributes: true,
  attributeFilter: ['lang'],
  subtree: true,
})

/**
 * callback of MutationObserver that detect language changes
 * @param {MutationRecord[]} records - mutation records
 */
function langMutationObserverCallback (records) {
  const triggeredNodes = new Set()
  const validatedNodes = new Set()
  const rootNodesToTrigger = new Set()
  for (const record of records) {
    const recordTarget = record.target
    const rootNode = recordTarget.getRootNode()
    rootNodesToTrigger.add(rootNode)
    const observingElements = rootNodes.get(rootNode)?.observingElements
    observingElements && observingElements.forEach((node) => {
      if (validatedNodes.has(node)) {
        return
      }
      validatedNodes.add(node)
      const result = handleLangMutationOnElement(node, recordTarget)
      if (result === changeTriggered) {
        triggeredNodes.add(node)
      }
    })
  }
  const event = new CustomEvent(rootEventName, { detail: { triggeredNodes: Array.from(triggeredNodes) } })
  for (const node of rootNodesToTrigger) {
    node.dispatchEvent(event)
  }
}

const changeTriggered = Object.freeze({ changeTriggered: true })
const changeNotTriggered = Object.freeze({ changeTriggered: false })
/**
 * @param {Element} element - target element
 * @param {Node} causingElement - the element that caused the locale change, most likely by having the `lang` attribute changed
 * @returns {Readonly<{ changeTriggered: boolean }>} result object if change has triggered or not
 */
function handleLangMutationOnElement (element, causingElement) {
  const info = observingElementsInfo.get(element)
  if (!info) {
    return changeNotTriggered
  }
  const oldLang = info.currentLang
  const newLang = getLanguageFromElement(element)
  if (newLang === oldLang) {
    return changeNotTriggered
  }
  info.currentLang = newLang
  info.observers.forEach(observer => {
    observer[data].callback([{
      target: element,
      causingElement,
      previousLanguage: oldLang,
      language: newLang,
    }])
  })
  return changeTriggered
}

/**
 * Creates an observer to handle `lang` change on DOM root
 * @param {Node} targetNode - root node be it the `<html>` element or the `ShadowRoot`
 * @returns {MutationObserver} created mutation observe observing `targetNode`
 */
function createObserver (targetNode) {
  const observer = new MutationObserver(langMutationObserverCallback)
  observer.observe(targetNode, mutationProperties)
  return observer
}

/**
 * Traverse DOM roots, creating an observer if not defined to listen for `lang` attribute change
 * @param {Node} rootNode - traversing root node
 * @param {Element} element - element to trigger when `rootNode` detects a language change
 */
function traverseRootNode (rootNode, element) {
  const observeInfomation = rootNodes.get(rootNode)
  if (observeInfomation) {
    observeInfomation.observingElements.add(element)
  } else {
    rootNodes.set(rootNode, {
      observer: createObserver(rootNode),
      observingElements: new IterableWeakSet([element]),
      targetNode: new WeakRef(rootNode),
    })
  }

  if (rootNode instanceof ShadowRoot) {
    const host = rootNode.host
    traverseRootNode(host.getRootNode(), element)
  }
}

/**
 * @param {Element} element - target element
 * @param {ElementLangObserver} observer - observer to observe
 */
export function observeLangFromElement (element, observer) {
  const oldVal = observingElementsInfo.get(element)
  if (oldVal) {
    oldVal.observers.add(observer)
    return
  }
  observingElementsInfo.set(element, {
    currentLang: getLanguageFromElement(element),
    observers: new Set([observer]),
  })
  const rootNode = element.getRootNode()
  traverseRootNode(rootNode, element)
}

/**
 * @param {Element} element - target element
 * @param {ElementLangObserver} observer - observing observer
 */
export function unobserveLangFromElement (element, observer) {
  const observers = observingElementsInfo.get(element)?.observers
  if (!observers) {
    return
  }
  observers.delete(observer)
  if (observers.size > 0) {
    return
  }

  observingElementsInfo.delete(element)
  for (const [rootNode, info] of rootNodes.entries()) {
    const { observingElements, observer } = info
    observingElements.delete(element)
    if (observingElements.size <= 0) {
      observer.disconnect()
      rootNodes.delete(rootNode)
    }
  }
}

/**
 * @typedef {object} ObserveInfomation
 * @property {IterableWeakSet<Element>} observingElements - the elements that will react when `targetNode` detects a language change
 * @property {MutationObserver} observer - mutationObserver applied to `targetNode`
 * @property {WeakRef<Node>} targetNode - rootNode of the current DOM (<html> or ShadowRoot)
 */

/**
 * @callback ElementLangObserverHandler
 * @param {ElementLangObserverRecord[]} records
 * @returns {void}
 */

/**
 * @typedef {object} ElementLangObserverRecord
 * @property {Element} target - observer target
 * @property {Node} causingElement - element that changed language
 * @property {string} previousLanguage - previous lang value
 * @property {string} language - new lang value
 */
