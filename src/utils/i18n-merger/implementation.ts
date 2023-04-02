import type { I18nDefinitionMap } from '../i18n-importer/mod.ts'
import {
  I18nDefinition,
  NormalizedI18nDefinition,
  normalizeI18nDefinition,
  normalizeI18nDefinitionMap,
  Translations,
} from '../i18n-normalizer/mod.ts'

type I18nLangMergeData = {
  kind: 'map'
  data: I18nDefinitionMap
  location: URL | string
} | {
  kind: 'definition'
  location: URL | string
  language: Intl.Locale | string
  data: I18nDefinition
} | {
  kind: 'translations'
  location: URL | string
  language: Intl.Locale | string
}

type I18nMergeIntermediaryResult = {
  [language: string]: {
    extends: Set<string>
    translations: Translations
  }
}

const merge = (...data: I18nLangMergeData[]) => {
  const mergeLang = (acc: I18nMergeIntermediaryResult, i18nDefinition: NormalizedI18nDefinition, language: string) => {
    const { translations, extends: ext } = normalizeI18nDefinition(i18nDefinition).result
    const strLang = language.toString()
    const definition = acc[strLang] || { extends: new Set(), translations: {} }
    const definitionExtSet = definition.extends
    ext.forEach((e) => definitionExtSet.add(e))

    definition.translations = {
      ...definition.translations,
      ...translations,
    }

    acc[strLang] = definition
    return acc
  }

  const result = data.reduce<I18nMergeIntermediaryResult>((acc, value) => {
    const { location, kind } = value
    const locationStr = typeof location === 'string' ? location : location.href
    if (kind === 'definition') {
      const i18nDefinition = normalizeI18nDefinition(value.data).result
      return mergeLang(acc, i18nDefinition, value.language.toString())
    }

    if (kind === 'translations') {
      const i18nDefinition = normalizeI18nDefinition(locationStr).result
      return mergeLang(acc, i18nDefinition, value.language.toString())
    }

    const i18nDefinitionMap = normalizeI18nDefinitionMap(value.data).result
    return Object.entries(i18nDefinitionMap).reduce<I18nMergeIntermediaryResult>((acc, [lang, def]) => {
      return mergeLang(acc, def, lang)
    }, acc)
  }, {})

  return Object.fromEntries(
    Object.entries(result).map(([lang, { extends: ext, translations }]) => [
      lang,
      {
        extends: [...ext],
        translations,
      },
    ]),
  )
}

const memoizedMerge = (data: I18nLangMergeData[]) => {
  let buildResult = () => {
    const result = merge(...data)
    buildResult = () => result
    return result
  }
  return () => buildResult()
}

const mergeInstance = (data: I18nLangMergeData[]) => {
  return Object.freeze({
    addMap: (i18nInfo: I18nDefinitionMap, location: URL | string) => mergeInstance([...data, { kind: 'map', data: i18nInfo, location }]),
    addDefinitionOnLanguage: (i18nDef: I18nDefinition, language: Intl.Locale | string, location: URL | string) =>
      mergeInstance([...data, { kind: 'definition', language, data: i18nDef, location }]),
    addTranslations: (location: URL | string, language: Intl.Locale | string) =>
      mergeInstance([...data, { kind: 'translations', language, location }]),
    build: memoizedMerge(data),
  })
}

export const builder = mergeInstance([])
