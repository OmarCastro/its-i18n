import { getLanguageFromElement } from './get-lang-from-element.util.ts'

interface ObserveInfomation {
  observingElements: Set<WeakRef<Element>>
  observer: MutationObserver
  targetNode: WeakRef<Node>
}

const rootNodes: Set<ObserveInfomation> = new Set()
const observingElementsCurrentLanguage: WeakMap<Element, string> = new WeakMap()

export const eventName = 'lang-changed'
export const rootEventName = 'lang-change-dispatched'

const mutationProperties = Object.freeze({
  attributes: true,
  attributeFilter: ['lang'],
  subtree: true,
} as MutationObserverInit)

function observeInfomationOfRootNode(targetNode: Node): ObserveInfomation | undefined {
  for (const observeInfomation of rootNodes) {
    const node = observeInfomation.targetNode.deref()
    if (!node) {
      rootNodes.delete(observeInfomation)
    }
    if (node === targetNode) {
      return observeInfomation
    }
  }
}

function createObserver(targetNode: Node) {
  const observer = new MutationObserver((records) => {
    const triggeredNodes = new Set() as Set<Node>
    const rootNodesToTrigger = new Set() as Set<Node>
    for (const record of records) {
      const rootNode = record.target.getRootNode()
      rootNodesToTrigger.add(rootNode)
      const observingElements = observeInfomationOfRootNode(rootNode)?.observingElements
      observingElements && observingElements.forEach((ref) => {
        const node = ref.deref()
        if (!node) {
          observingElements.delete(ref)
          return
        }
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
  const ref = new WeakRef(element)
  const observeInfomation = observeInfomationOfRootNode(rootNode)
  if (observeInfomation) {
    observeInfomation.observingElements.add(ref)
  } else {
    rootNodes.add({
      observer: createObserver(rootNode),
      observingElements: new Set([ref]),
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
  for (const ref of observingElements.values()) {
    const node = ref.deref()
    if (!node || node === element) {
      observingElements.delete(ref)
    }
  }
}

export function unobserveLangFromElement(element: Element) {
  for (const info of rootNodes.values()) {
    const { observingElements, observer } = info
    removeObservingElementFrom(observingElements, element)
    if (observingElements.size <= 0) {
      observer.disconnect()
      rootNodes.delete(info)
    }
  }
}
