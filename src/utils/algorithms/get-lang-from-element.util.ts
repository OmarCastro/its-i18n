import { traverseUpDomWithSlots } from './traverse-up-dom.js'

function handleInvalidLanguage(elementWithLangAttr: Element, invalidLanguage: string): string {
  if (elementWithLangAttr === elementWithLangAttr.ownerDocument.documentElement) {
    return navigator.language
  } else if (elementWithLangAttr.parentNode instanceof ShadowRoot) {
    return getLanguageFromElement(elementWithLangAttr.parentNode.host)
  }
  return getLanguageFromElement(elementWithLangAttr.parentElement)
}

export function getLanguageFromElement(element: Element | null): string {
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
