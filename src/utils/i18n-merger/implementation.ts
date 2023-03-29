import type { I18nDefinition, I18nDefinitionMap } from '../i18n-importer/mod.ts'
import { normalizeI18nDefinition, normalizeI18nDefinitionMap } from '../i18n-normalizer/mod.ts'

type I18nLangMergeData = {
  kind: 'map'
  data: I18nDefinitionMap
  location: URL | string
} | {
  kind: 'definition'
  location: URL | string
  language: Intl.Locale | string
  data: I18nDefinition
}

type I18nMergeIntermediaryResult = {
  [language: string]: {
    extends: Set<string>
    translations: I18nDefinition['translations']
  }
}

const merge = (...data: I18nLangMergeData[]) => {
  const mergeLang = (acc: I18nMergeIntermediaryResult, i18nDefinition: I18nDefinition, language: string) => {
    const { translations, extends: ext } = i18nDefinition
    const strLang = language.toString()
    const definition = acc[strLang] || { extends: new Set(), translations: {} }
    const definitionExtSet = definition.extends

    if (typeof ext === 'string') {
      definitionExtSet.add(ext)
    } else if (Array.isArray(ext)) {
      ext.forEach((e) => definitionExtSet.add(e))
    }

    definition.translations = {
      ...definition.translations,
      ...translations,
    }

    acc[strLang] = definition
    return acc
  }

  const result = data.reduce<I18nMergeIntermediaryResult>((acc, value) => {
    if (value.kind === 'definition') {
      return mergeLang(acc, value.data, value.language.toString())
    }

    return Object.entries(value.data).reduce<I18nMergeIntermediaryResult>((acc, [lang, def]) => {
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
    build: memoizedMerge(data),
  })
}

export const builder = mergeInstance([])
