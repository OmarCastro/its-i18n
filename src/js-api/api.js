/**
 * This JS API is to allow I18n on canvas elements because all the logic goes to JS
 */
import { getStoresInfoFromElement, setStoreFromElement, isStoreSetOnElement } from '../utils/store-map/store-map.js'
import { queryFromTranslations } from '../utils/translation-query/translation-query.util.js'
import { getLanguageFromElement } from '../utils/algorithms/get-lang-from-element.util.js'
import { loadI18n } from '../html-loader/html-loader.js'

/**
 * Translates i18n key
 * @param {string} key - target key
 * @param {Context} [context] - context for tranlations
 * @returns {Promise<string>} future translated key
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
 * @param {string} key - target key
 * @returns {Promise<string>} future translated key
 */
async function i18nFromBrowserLanguage (key) {
  return await i18nFromElementAndLocale(key, document.documentElement, getLanguageFromElement(document.documentElement))
}

/**
 *
 * @param {string} key - target key
 * @param {Element} element - target element
 * @param {string | Intl.Locale} localeString - target language to translate
 * @returns {Promise<string>} future translated key
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
 * @param {string} key - target key
 * @param {import("../utils/store/translation-store.js").TranslationStore} store - target store
 * @param {string | Intl.Locale} localeString - target language to translate
 * @returns {Promise<string>} future translated key
 */
async function i18nFromStoreAndLocale (key, store, localeString) {
  const locale = new Intl.Locale(localeString)
  const result = queryFromTranslations(key, await store.translationsFromLanguage(locale))
  return result.found ? result.translate(locale) : key
}

/** @typedef {DOMContext| StoreContext | LocaleContext} Context */

/**
 * @typedef {object} DOMContext
 * Translate based on information of an DOM element
 * @property {Element} element - target element
 * @property {string | Intl.Locale} [locale] - target language to translate, finds the languange from element if not defined
 */

/**
 * @typedef {object} StoreContext
 * Translate based on a store
 * @property {import("../utils/store/translation-store.js").TranslationStore} store - target store
 * @property {string | Intl.Locale} [locale] - target language to translate, finds the languange from DOM document if not defined
 */

/**
 * @typedef {object} LocaleContext
 * Translate based on initially loaded i8n data in the window
 * @property {string | Intl.Locale} [locale] - target language to translate, finds the languange from DOM document if not defined
 */
