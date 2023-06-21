import { traverseUpDomWithSlots } from './traverse-up-dom.js'

/**
 * Check wheter the element is translatable
 *
 * It respects the `translate` global attribute:
 *
 * >   The translate attribute is an enumerated attribute that is used to
 * > specify whether an element's attribute values and the values of its
 * > Text node children are to be translated when the page is localized,
 * > or whether to leave them unchanged.
 *
 * The tranlate will apply to all elements, including non-HTML elements
 *
 * @see https://html.spec.whatwg.org/multipage/dom.html#attr-translate
 * @param {Element} element
 * @returns {boolean} true if element is translatable, false otherwise
 */
export function isElementTranslatable(element) {
  // the vast majority of element are HTMLElement, so validating it first is good
  if (element instanceof HTMLElement) {
    return element.translate
  }
  if (element == null) {
    return false
  }
  for (const node of traverseUpDomWithSlots(element)) {
    if (node instanceof HTMLElement) {
      return node.translate
    }
    const translateValue = node.getAttribute('translate')
    if (translateValue == null) continue

    if (translateValue === '' || translateValue === 'yes') {
      return true
    } else if (translateValue === 'no') {
      return false
    }
  }
  return true
}
