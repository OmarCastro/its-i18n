/**
 * This JS API is to allow I18n on canvas elements because all the logic goes to JS
 */
import { getStoresInfoFromElement } from '../utils/store-map/store-map.js'
import { queryFromTranslations } from '../utils/translation-query/translation-query.util.js'
import { getLanguageFromElement } from '../utils/algorithms/get-lang-from-element.util.js'

/**
 * @overload
 * @param {string} key
 * @returns {Promise<string>}
 *//**
 * @overload
 * @param {string} key
 * @param {DOMContext} context
 * @returns {Promise<string>}
 *//**
 *//**
 * @overload
 * @param {string} key
 * @param {LocaleContext} context
 * @returns {Promise<string>}
 *//**
 *
 *
 * @param {string} key
 * @param {DOMContext | LocaleContext} [context]
 */
export async function i18n (key, context) {
  if (!context) {
    return await i18nFromBrowserLanguage(key)
  }
  if ('element' in context) {
    const { locale, element } = context
    const localeStr = locale || getLanguageFromElement(element)
    return await i18nFromElementAndLocale(key, element, localeStr)
  }
  const { locale } = context
  const localeStr = locale || getLanguageFromElement(document.documentElement)
  return await i18nFromElementAndLocale(key, document.documentElement, localeStr)
}
/**
 * @param {string} key
 */
async function i18nFromBrowserLanguage (key) {
  return await i18nFromElementAndLocale(key, document.documentElement, navigator.language)
}

/**
 *
 * @param {string} key
 * @param {Element} element
 * @param {string | Intl.Locale} localeString
 * @returns
 */
async function i18nFromElementAndLocale (key, element, localeString) {
  const locale = new Intl.Locale(localeString)

  for (const storeInfo of getStoresInfoFromElement(element)) {
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
 * @property {string | Intl.Locale} [locale]
 */

/**
 * @typedef {object} LocaleContext
 * @property {string | Intl.Locale} locale
 */
