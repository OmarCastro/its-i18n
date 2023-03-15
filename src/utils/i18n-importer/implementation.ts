import type { I18nDefinition, I18nDefinitionMap, Translations } from './provider.ts'
import { provide } from './provider.ts'

type I18nDefinitionMapResponse = {
  [key: string]: Partial<I18nDefinition>
}

function isTranslationMap(json: Translations): json is Translations {
  if (typeof json !== 'object' || Array.isArray(json)) {
    return false
  }
  return Object.keys(json).every((key) => typeof [json[key]] === 'string')
}

function isi18nDefinition(definition: Partial<I18nDefinition>): definition is Partial<I18nDefinition> {
  const { extends: xtends, translations } = definition
  if (xtends == null) {
    return true
  }
  if (typeof xtends === 'string') {
    return true
  }
  if ((Array.isArray(xtends) && xtends.every((field) => typeof field === 'string'))) {
    return true
  }

  return false
}

function isI18nDefinitionMap(json: I18nDefinitionMapResponse): json is I18nDefinitionMapResponse {
  if (typeof json !== 'object' || Array.isArray(json)) {
    return false
  }
  return Object.keys(json).every((key) => isi18nDefinition(json[key]))
}

function normalizeI18nDefinitionMap(response: I18nDefinitionMapResponse): I18nDefinitionMap {
  const result = Object.fromEntries(
    Object.entries(response).map(([key, value]) => [key, {
      ...value,
      translations: value.translations ?? {},
    }]),
  )

  return result
}

export async function importLanguage(reqUrl: string | URL, base: string | URL): Promise<Translations> {
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
  if (!isI18nDefinitionMap(json)) {
    console.error('expected json from url %o to be a map of translations, instead returned %o, returning empty translation', url.href, json)
    return {}
  }
  return normalizeI18nDefinitionMap(json)
}

provide({
  importLanguage,
  importI18nJson,
})
