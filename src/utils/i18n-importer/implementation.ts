import type { I18nDefinitionMap, Translations } from './provider.ts'
import { normalizeI18nDefinitionMap, normalizeTranslations } from '../i18n-normalizer/mod.ts'
import { provide } from './provider.ts'

export async function importTranslations(reqUrl: string | URL, base: string | URL): Promise<Translations> {
  const url = new URL(reqUrl, base)
  const response = await fetch(url)
  const json = await response.json()
  const normalizeResult = normalizeTranslations(json)
  normalizeResult.errors.forEach((error) => console.error('Error on %s::%s, %s', url.href, error.path, error.message))
  return normalizeResult.result
}

export async function importI18nJson(reqUrl: string | URL, base: string | URL): Promise<I18nDefinitionMap> {
  const url = new URL(reqUrl, base)
  const response = await fetch(url)
  const json = await response.json()
  const normalizeResult = normalizeI18nDefinitionMap(json)
  normalizeResult.errors.forEach((error) => console.error('Error on %s::%s, %s', url.href, error.path, error.message))
  normalizeResult.warnings.forEach((warning) => console.warn('Warning on %s::%s, %s', url.href, warning.path, warning.message))
  return normalizeResult.result
}

provide({
  importTranslations,
  importI18nJson,
})
