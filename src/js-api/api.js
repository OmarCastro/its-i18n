/**
 * This JS API is to allow I18n on canvas elements because all the logic goes to JS
 */
import { getStoresInfoFromElement, setStoreFromElement, isStoreSetOnElement } from '../utils/store-map/store-map.js'
import { queryFromTranslations } from '../utils/translation-query/translation-query.util.js'
import { getLanguageFromElement } from '../utils/algorithms/get-lang-from-element.util.js'
import { loadI18n } from '../html-loader/html-loader.js'

/**
 * Translates i18n key
 *
 * @param {string} key - target key
 * @param {Context} [context] - context for tranlations
 * @returns {Promise<string>}
 */
export async function translate (key, context) {
  if (!context) {
    return await i18nFromBrowserLanguage(key)
  }
  if ('element' in context && context.element) {
    const { locale, element } = context
    const localeStr = locale || getLanguageFromElement(element)
    return await i18nFromElementAndLocale(key, element, localeStr)
  }
  const { locale } = context
  const localeStr = locale || getLanguageFromElement(document.documentElement)
  if ('store' in context && context.store) {
    return await i18nFromStoreAndLocale(key, context.store, localeStr)
  }
  return await i18nFromElementAndLocale(key, document.documentElement, localeStr)
}

/**
 * @param {string} key
 */
async function i18nFromBrowserLanguage (key) {
  return await i18nFromElementAndLocale(key, document.documentElement, getLanguageFromElement(document.documentElement))
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
  if (element?.ownerDocument?.documentElement && !isStoreSetOnElement(element.ownerDocument.documentElement)) {
    const window = document.defaultView
    if (!window) { return key }
    const store = await loadI18n(window)
    setStoreFromElement(document.documentElement, store)
  }

  for (const storeInfo of getStoresInfoFromElement(element)) {
    const result = queryFromTranslations(key, await storeInfo.store.translationsFromLanguage(locale))
    if (result.found) {
      return result.translate(locale)
    }
  }
  return key
}

/**
 *
 * @param {string} key
 * @param {import("../utils/store/translation-store.js").TranslationStore} store
 * @param {string | Intl.Locale} localeString
 * @returns
 */
async function i18nFromStoreAndLocale (key, store, localeString) {
  const locale = new Intl.Locale(localeString)
  const result = queryFromTranslations(key, await store.translationsFromLanguage(locale))
  return result.found ? result.translate(locale) : key
}

/** @typedef {DOMContext| StoreContext | LocaleContext} Context */

/**
 * @typedef {object} DOMContext
 * @property {Element} element
 * @property {string | Intl.Locale} [locale]
 */

/**
 * @typedef {object} StoreContext
 * @property {import("../utils/store/translation-store.js").TranslationStore} store
 * @property {string | Intl.Locale} [locale]
 */

/**
 * @typedef {object} LocaleContext
 * @property {string | Intl.Locale} [locale]
 */
