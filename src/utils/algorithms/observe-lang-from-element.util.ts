import { getLanguageFromElement } from './get-lang-from-element.util.js'
import { IterableWeakMap, IterableWeakSet } from './iterable-weak-struct.js'

interface ObserveInfomation {
  observingElements: IterableWeakSet<Element>
  observer: MutationObserver
  targetNode: WeakRef<Node>
}

const rootNodes: IterableWeakMap<Node, ObserveInfomation> = new IterableWeakMap()
const observingElementsCurrentLanguage: WeakMap<Element, string> = new WeakMap()

export const eventName = 'lang-changed'
export const rootEventName = 'lang-change-dispatched'

const mutationProperties = Object.freeze({
  attributes: true,
  attributeFilter: ['lang'],
  subtree: true,
} as MutationObserverInit)

function createObserver(targetNode: Node) {
  const observer = new MutationObserver((records) => {
    const triggeredNodes = new Set() as Set<Node>
    const rootNodesToTrigger = new Set() as Set<Node>
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
        if (newLang == oldLang) {
          return
        }
        observingElementsCurrentLanguage.set(node, newLang)
        const event = new CustomEvent(eventName, { detail: { oldLang, lang: newLang } })
        node.dispatchEvent(event)
        triggeredNodes.add(node)
      })
    }
    const event = new CustomEvent(rootEventName, { detail: { triggeredNodes: Array.from(triggeredNodes) } })
    rootNodesToTrigger.forEach((node) => node.dispatchEvent(event))
  })

  observer.observe(targetNode, mutationProperties)
  return observer
}

function traverseRootNode(rootNode: Node, element: Element) {
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

export function observeLangFromElement(element: Element) {
  const rootNode = element.getRootNode()
  observingElementsCurrentLanguage.set(element, getLanguageFromElement(element))
  traverseRootNode(rootNode, element)
}

function removeObservingElementFrom(observingElements: ObserveInfomation['observingElements'], element: Element) {
  for (const node of observingElements.values()) {
    if (!node || node === element) {
      observingElements.delete(node)
    }
  }
}

export function unobserveLangFromElement(element: Element) {
  for (const [rootNode, info] of rootNodes.entries()) {
    const { observingElements, observer } = info
    removeObservingElementFrom(observingElements, element)
    if (observingElements.size <= 0) {
      observer.disconnect()
      rootNodes.delete(rootNode)
    }
  }
}
