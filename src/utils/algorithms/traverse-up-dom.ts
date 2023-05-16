/**
 *   traverse up in the document DOM closest element by passing shadow DOM
 */
export function* traverseUpDom(targetElement: Element = this) {
  let el: Element | null = targetElement
  while (el != null) {
    yield el
    const { parentNode } = el
    if (parentNode instanceof ShadowRoot) {
      el = parentNode.host
      continue
    }
    if (parentNode instanceof Document) {
      return
    }
    el = el.parentElement
  }
}
