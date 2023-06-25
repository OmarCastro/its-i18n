import { normalizeI18nDefinitionMap, normalizeTranslations } from '../i18n-normalizer/i18n-normalizer.js'
import { provide } from './provider.js'

/** @type {import('./provider.js').ImportTranslations} */
export async function importTranslations (url, baseUrl) {
  const absoluteUrl = new URL(url, baseUrl)
  const response = await fetch(absoluteUrl)
  const json = await response.json()
  const normalizeResult = normalizeTranslations(json)
  normalizeResult.errors.forEach((error) => console.error('Error on %s::%s, %s', absoluteUrl.href, error.path, error.message))
  return normalizeResult.result
}

/** @type {import('./provider.js').ImportI18nJson} */
export async function importI18nJson (url, baseUrl) {
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
  importI18nJson,
})
