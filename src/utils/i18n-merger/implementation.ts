import type { I18nDefinition, I18nDefinitionMap } from '../i18n-importer/mod.ts'

type I18nLangDefinition = I18nDefinition & { language: Intl.Locale | string }
type I18nLangMergeData = I18nDefinitionMap | I18nLangDefinition

type I18nMergeIntermediaryResult = {
  [language: string]: {
    extends: Set<string>
    translations: I18nDefinition['translations']
  }
}

export const merge = (...data: I18nLangMergeData[]) => {
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
    if (value.language) {
      return mergeLang(acc, value as I18nLangDefinition, value.language.toString())
    }

    return Object.entries(value).reduce<I18nMergeIntermediaryResult>((acc, [lang, def]) => {
      return mergeLang(acc, def as I18nLangDefinition, lang)
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

const mergeInstance = (data: I18nLangMergeData[]) => {
  let buildResult = () => {
    const result = merge(...data)
    buildResult = () => result
    return result
  }
  return Object.freeze({
    add: (...i18nInfo: I18nLangMergeData[]) => mergeInstance([...data, ...i18nInfo]),
    build: () => buildResult(),
  })
}

const Merger = () => {
  return mergeInstance([])
}
