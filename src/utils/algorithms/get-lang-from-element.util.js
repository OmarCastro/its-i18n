import { traverseUpDomWithSlots } from './traverse-up-dom.js'

/**
 * @param {Element} element - target element
 * @returns {string} fallback language
 */
function getFallbackLanguage (element) {
  const root = element.ownerDocument.defaultView ?? globalThis
  if (!root.navigator) {
    // OS/node/browser independent way of obtaining the default locale
    return Intl.DateTimeFormat().resolvedOptions().locale
  }
  const langs = root.navigator.languages || [root.navigator.language]
  return langs[0]
}

/**
 * @param {Element} element - element with invalid lang attribute
 * @param {string} invalidLanguage - the invalid language detected
 * @returns {string} corrected language
 */
function handleInvalidLanguage (element, invalidLanguage) {
  if (element === element.ownerDocument.documentElement) {
    return getFallbackLanguage(element)
  } else if (element.parentNode instanceof ShadowRoot) {
    return getLanguageFromElement(element.parentNode.host)
  }
  return getLanguageFromElement(element.parentElement)
}

/**
 * Gets the currently applied language of element, get default locale otherwise
 * @param {Element | null} element - target element
 * @returns {string} element language
 */
export function getLanguageFromElement (element) {
  if (element == null) {
    return Intl.DateTimeFormat().resolvedOptions().locale
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

  return getFallbackLanguage(element)
}
