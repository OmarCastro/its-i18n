import type { I18nDefinitionMap, Translations } from './provider.ts'
import { normalizeI18nDefinitionMap } from '../i18n-normalizer/mod.ts'
import { provide } from './provider.ts'

function isTranslationMap(json: Translations): json is Translations {
  if (typeof json !== 'object' || Array.isArray(json)) {
    return false
  }
  return Object.values(json).every((value) => typeof value === 'string')
}

export async function importTranslations(reqUrl: string | URL, base: string | URL): Promise<Translations> {
  const url = new URL(reqUrl, base)
  const response = await fetch(url)
  const json = await response.json()
  if (!isTranslationMap(json)) {
    console.error('expected json from url %o to be a map of translations, instead returned %o, returning empty translation', url.href, json)
    return {}
  }
  return json
}

export async function importI18nJson(reqUrl: string | URL, base: string | URL): Promise<I18nDefinitionMap> {
  const url = new URL(reqUrl, base)
  const response = await fetch(url)
  const json = await response.json()
  const normalizeResult = normalizeI18nDefinitionMap(json)
  normalizeResult.errors.forEach((error) => console.error('Error on %s::%s, %s', url.href, error.path, error.message))
  normalizeResult.warnings.forEach((warning) => console.warn('Warning on %s::%s, %s', url.href, warning.path, warning.message))
  return normalizeI18nDefinitionMap(json).result
}

provide({
  importTranslations,
  importI18nJson,
})
