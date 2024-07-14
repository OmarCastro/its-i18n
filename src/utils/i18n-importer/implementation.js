import { normalizeI18nDefinitionMap, normalizeTranslations } from '../i18n-normalizer/i18n-normalizer.js'
import { provide } from './provider.js'
/** @import { Translations, I18nDefinitionMap } from './i18n-importer.js' */

/**
 * Imports translations from an URL
 * @param {string | URL} url - translations URL
 * @param {string | URL} baseUrl - base URL to search if it is a relative URL
 * @returns {Promise<Translations>} translations map
 */
export async function importTranslations (url, baseUrl) {
  const absoluteUrl = new URL(url, baseUrl)
  const response = await fetch(absoluteUrl)
  const json = await response.json()
  const normalizeResult = normalizeTranslations(json)
  normalizeResult.errors.forEach((error) => console.error('Error on %s::%s, %s', absoluteUrl.href, error.path, error.message))
  return normalizeResult.result
}

/**
 * Imports an i18n definition map from an URL
 * @param {string | URL} url - definition file URL
 * @param {string | URL} baseUrl - base URL to search if it is a relative URL
 * @returns {Promise<I18nDefinitionMap>} i18n definition map
 */
export async function importDefinitionMap (url, baseUrl) {
  const absoluteUrl = new URL(url, baseUrl)
  const response = await fetch(absoluteUrl)
  const json = await response.json()
  const normalizeResult = normalizeI18nDefinitionMap(json)
  normalizeResult.errors.forEach((error) => console.error('Error on %s::%s, %s', absoluteUrl.href, error.path, error.message))
  normalizeResult.warnings.forEach((warning) => console.warn('Warning on %s::%s, %s', absoluteUrl.href, warning.path, warning.message))
  return normalizeResult.result
}

provide({
  importTranslations,
  importDefinitionMap,
})
