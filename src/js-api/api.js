/**
 * This JS API is to allow I18n on canvas elements because all the logic goes to JS
 */
import { getStoresInfoFromElement } from '../utils/store-map/store-map.js'
import { queryFromTranslations } from '../utils/translation-query/translation-query.util.js'

/**
 * @overload
 * @param {string} key
 *//**
 * @overload
 * @param {string} key
 * @param {DOMContext} context
  *//**
 *//**
 * @overload
 * @param {string} key
 * @param {LocaleContext} context
  *//**
 *
 *
 * @param {string} key
 * @param {DOMContext | LocaleContext} [context]
 */
async function i18n (key, context) {
  if (!context) {
    return await i18nFromBrowserLanguage(key)
  }
}
/**
 * @param {string} key
 */
async function i18nFromBrowserLanguage (key) {
  const locale = new Intl.Locale(navigator.language)
  for (const storeInfo of getStoresInfoFromElement(document.documentElement)) {
    const result = queryFromTranslations(key, await storeInfo.store.translationsFromLanguage(locale))
    if (result.found) {
      return result.translate(locale)
    }
  }
  return key
}

/**
 * @typedef {object} DOMContext
 * @property {Element} element
 */

/**
 * @typedef {object} LocaleContext
 * @property {Intl.Locale} element
 */
