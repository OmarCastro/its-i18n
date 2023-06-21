import { traverseUpDomWithSlots } from './traverse-up-dom.js'

/**
 * @param {Element} elementWithLangAttr
 * @param {string} invalidLanguage
 * @returns {string} corrected language
 */
function handleInvalidLanguage(elementWithLangAttr, invalidLanguage) {
  if (elementWithLangAttr === elementWithLangAttr.ownerDocument.documentElement) {
    return navigator.language
  } else if (elementWithLangAttr.parentNode instanceof ShadowRoot) {
    return getLanguageFromElement(elementWithLangAttr.parentNode.host)
  }
  return getLanguageFromElement(elementWithLangAttr.parentElement)
}

/**
 * Gets the currently applied language of the element
 *
 * @param {Element | null} element
 * @returns {string} element language
 */
export function getLanguageFromElement(element) {
  if (element == null) {
    return navigator.language
  }
  for (const node of traverseUpDomWithSlots(element)) {
    const langValue = node.getAttribute('lang')
    if (!langValue) continue
    try {
      const locale = new Intl.Locale(langValue)
      const { language, region } = locale
      if (region == null) {
        return language
      }
      return `${language}-${region}`
    } catch (e) {
      return handleInvalidLanguage(node, langValue)
    }
  }

  return navigator.language
}
