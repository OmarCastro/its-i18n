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
 * @see https://html.spec.whatwg.org/multipage/dom.html#attr-translate
 * @param {Element} element - t
 * @returns {boolean} true if element is translatable, false otherwise
 */
export function isElementTranslatable (element) {
  // the vast majority of element are HTMLElement, so validating it first is good
  if (element instanceof HTMLElement) {
    return element.translate
  }
  if (element == null) {
    return false
  }
  for (const node of traverseUpDomWithSlots(element)) {
    const value = translateValue(node)
    if (value != null) { return value }
  }
  return true
}

/**
 * @param {Element} element - target element, may have `translate` attribute defined or not
 * @returns {boolean | null} null if translateValue is invalid, true if translate is enabled, false otherwise
 */
function translateValue (element) {
  if (element instanceof HTMLElement) {
    return element.translate
  }
  const translateValue = element.getAttribute('translate')

  if (translateValue === '' || translateValue === 'yes') {
    return true
  } else if (translateValue === 'no') {
    return false
  }

  return null
}
