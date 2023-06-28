import { getLanguageFromElement } from './get-lang-from-element.util.js'
import { IterableWeakMap, IterableWeakSet } from './iterable-weak-struct.js'

/** @type {IterableWeakMap<Node, ObserveInfomation>} */
const rootNodes = new IterableWeakMap()

/** @type {WeakMap<Element, string>} */
const observingElementsCurrentLanguage = new WeakMap()

export const eventName = 'lang-changed'
export const rootEventName = 'lang-change-dispatched'

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
      const event = new CustomEvent(eventName, { detail: { oldLang, lang: newLang } })
      node.dispatchEvent(event)
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
