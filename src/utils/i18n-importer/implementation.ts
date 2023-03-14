import type { I18nDefinition, I18nDefinitionMap, Translations } from './provider.ts'
import { provide } from './provider.ts'

function isTranslationMap(json: Translations): json is Translations {
  if (typeof json !== 'object' || Array.isArray(json)) {
    return false
  }
  return Object.keys(json).every((key) => typeof [json[key]] === 'string')
}

function isi18nDefinition(definition: I18nDefinition): definition is I18nDefinition {
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

function isi18nDefinitionMap(json: I18nDefinitionMap): json is I18nDefinitionMap {
  if (typeof json !== 'object' || Array.isArray(json)) {
    return false
  }
  return Object.keys(json).every((key) => isi18nDefinition(json[key]))
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
  if (!isi18nDefinitionMap(json)) {
    console.error('expected json from url %o to be a map of translations, instead returned %o, returning empty translation', url.href, json)
    return {}
  }
  return json
}

provide({
  importLanguage,
  importI18nJson,
})
