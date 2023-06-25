import { normalizeI18nDefinition, normalizeI18nDefinitionMap } from '../i18n-normalizer/i18n-normalizer.js'

/**
 * Add merge data to accumulator
 *
 * @param {I18nMergeIntermediaryResult} acc - acc
 * @param {NormalizedI18nDefinition} i18nDefinition
 * @param {string} language
 * @param {string | URL} locationBase
 * @returns
 */
const mergeLang = (acc, i18nDefinition, language, locationBase) => {
  const { translations, import: ext } = normalizeI18nDefinition(i18nDefinition).result
  const strLang = language.toString()
  const definition = acc[strLang] || { import: new Set(), translations: {} }
  const definitionExtSet = definition.import
  ext.forEach((e) => {
    const importLocation = new URL(e, locationBase).href
    definitionExtSet.add(importLocation)
  })

  definition.translations = {
    ...definition.translations,
    ...translations,
  }

  acc[strLang] = definition
  return acc
}

/**
 *
 * @param  {...I18nLangMergeData} data
 * @returns {NormalizedI18nDefinitionMap}
 */
const merge = (...data) => {
  const result = data.reduce((acc, value) => {
    const { location, kind } = value
    const locationStr = typeof location === 'string' ? location : location.href
    if (kind === 'definition') {
      const i18nDefinition = normalizeI18nDefinition(value.data).result
      return mergeLang(acc, i18nDefinition, value.language.toString(), location)
    }

    if (kind === 'translations') {
      const i18nDefinition = normalizeI18nDefinition(locationStr).result
      return mergeLang(acc, i18nDefinition, value.language.toString(), location)
    }

    const i18nDefinitionMap = normalizeI18nDefinitionMap(value.data).result
    return Object.entries(i18nDefinitionMap).reduce((acc, [lang, def]) => {
      return mergeLang(acc, def, lang, location)
    }, acc)
  }, {})

  return Object.fromEntries(
    Object.entries(result).map(([lang, { import: ext, translations }]) => [
      lang,
      {
        import: [...ext],
        translations,
      },
    ]),
  )
}

/**
 *
 * @param {I18nLangMergeData[]} data
 * @returns
 */
const memoizedMerge = (data) => {
  let buildResult = () => {
    const result = merge(...data)
    buildResult = () => result
    return result
  }
  return () => buildResult()
}

/**
 *
 * @param {I18nLangMergeData[]} data
 * @returns {MergerInstance}
 */
const mergeInstance = (data) => ({
  addMap: (i18nInfo, location) => mergeInstance([...data, { kind: 'map', data: i18nInfo, location }]),
  addDefinitionOnLanguage: (i18nDef, language, location) => mergeInstance([...data, { kind: 'definition', language, data: i18nDef, location }]),
  addTranslations: (location, language) => mergeInstance([...data, { kind: 'translations', language, location }]),
  build: memoizedMerge(data),
})

export const builder = mergeInstance([])

/** @typedef {{[language: string]: {import: Set<string>,translations: Translations}}} I18nMergeIntermediaryResult */

/** @typedef {I18nMapMergeData | I18nDefinitionMergeData | I18nTranslationMergeData } I18nLangMergeData */

/**
 * @typedef {object} I18nMapMergeData
 * @property {'map'} kind
 * @property {I18nDefinitionMap} data
 * @property {URL | string} location
 */

/**
 * @typedef {object} I18nDefinitionMergeData
 * @property {'definition'} kind
 * @property {I18nDefinition} data
 * @property {URL | string} location
 * @property {Intl.Locale | string} language
 */

/**
 * @typedef {object} I18nTranslationMergeData
 * @property {'translations'} kind
 * @property {URL | string} location
 * @property {Intl.Locale | string} language
 */

/**
 * @typedef {object} MergerInstance
 * @property {(i18nInfo: I18nDefinitionMap, location: URL | string) => MergerInstance} addMap
 * @property {(i18nDef: I18nDefinition, language: Intl.Locale | string, location: URL | string) => MergerInstance} addDefinitionOnLanguage
 * @property {(location: URL | string, language: Intl.Locale | string) => MergerInstance} addTranslations
 * @property {() => NormalizedI18nDefinitionMap} build
 */

/** @typedef {import ('../i18n-normalizer/i18n-normalizer.js').I18nDefinitionMap} I18nDefinitionMap */
/** @typedef {import ('../i18n-normalizer/i18n-normalizer.js').Translations} Translations */
/** @typedef {import ('../i18n-normalizer/i18n-normalizer.js').I18nDefinition} I18nDefinition */
/** @typedef {import ('../i18n-normalizer/i18n-normalizer.js').NormalizedI18nDefinition} NormalizedI18nDefinition */
/** @typedef {import ('../i18n-normalizer/i18n-normalizer.js').NormalizedI18nDefinitionMap} NormalizedI18nDefinitionMap */
