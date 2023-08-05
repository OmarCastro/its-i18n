import { getLanguageFromElement } from '../utils/algorithms/get-lang-from-element.util.js'
import { IterableWeakMap, IterableWeakSet } from '../utils/algorithms/iterable-weak-struct.js'

/** @type {IterableWeakMap<Node, ObserveInfomation>} */
const rootNodes = new IterableWeakMap()

const data = Symbol('ElementLangObserverData')

/** @type {WeakMap<Element, string>} */
const observingElementsCurrentLanguage = new WeakMap()

/** @type {IterableWeakSet<ElementLangObserver>} */
const observers = new IterableWeakSet()

const rootNodeObserver = {

}

export const eventName = 'lang-changed'
export const rootEventName = 'lang-change-dispatched'

export class ElementLangObserver {
  /**
   *
   * @param {Function} callback
   */
  constructor (callback) {
    this[data] = {
      callback,
      observingElements: new IterableWeakSet(),
    }
    observers.add(this)
  }

  /**
   *
   * @param {Element} element
   */
  observe (element) {
    if (!isBeingObseved(element)) {
      observeLangFromElement(element)
    }
    this[data].observingElements.add(element)
  }

  /**
   *
   * @param {Element} element
   */
  unobserve (element) {
    this[data].observingElements.delete(element)
    if (!isBeingObseved(element)) {
      unobserveLangFromElement(element)
    }
  }

  static rootNodeObserver () {
    return rootNodeObserver
  }
}

/**
 * Checks if any observer is observing the element
 * @param {Element} element
 */
function isBeingObseved (element) {
  for (const { [data]: { observingElements } } of observers) {
    if (observingElements.has(element)) {
      return true
    }
  }
  return false
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
 * @param {MutationRecord[]} records
 */
function langMutationObserverCallback (records) {
  const triggeredNodes = new Set()
  const rootNodesToTrigger = new Set()
  for (const record of records) {
    const rootNode = record.target.getRootNode()
    rootNodesToTrigger.add(rootNode)
    const observingElements = rootNodes.get(rootNode)?.observingElements
    observingElements && observingElements.forEach((node) => {
      if (triggeredNodes.has(node)) {
        return
      }
      const oldLang = observingElementsCurrentLanguage.get(node)
      const newLang = getLanguageFromElement(node)
      if (newLang === oldLang) {
        return
      }
      observingElementsCurrentLanguage.set(node, newLang)
      observers.forEach(observer => {
        const { callback: trigger, observingElements } = observer[data]
        if (observingElements.has(node)) {
          trigger({
            target: node,
            causingElement: record.target,
            previousLanguage: oldLang,
            language: newLang,
          })
        }
      })
      triggeredNodes.add(node)
    })
  }
  const event = new CustomEvent(rootEventName, { detail: { triggeredNodes: Array.from(triggeredNodes) } })
  for (const node of rootNodesToTrigger) {
    node.dispatchEvent(event)
  }
}

/**
 * Creates an
 * @param {Node} targetNode
 * @returns
 */
function createObserver (targetNode) {
  const observer = new MutationObserver(langMutationObserverCallback)
  observer.observe(targetNode, mutationProperties)
  return observer
}

/**
 *
 * @param {Node} rootNode
 * @param {Element} element
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
 *
 * @param {Element} element
 */
export function observeLangFromElement (element) {
  const rootNode = element.getRootNode()
  observingElementsCurrentLanguage.set(element, getLanguageFromElement(element))
  traverseRootNode(rootNode, element)
}

/**
 *
 * @param {Element} element
 */
export function unobserveLangFromElement (element) {
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
