import { normalizeI18nDefinition, normalizeI18nDefinitionMap } from '../i18n-normalizer/i18n-normalizer.js'

/**
 * Reducer for {@link merge} function, works on data prepared in  {@link mergeReducer}
 * @param {I18nMergeIntermediaryResult} acc - accumulator
 * @param {NormalizedI18nDefinition} i18nDefinition - i18n definition
 * @param {string} language - i18n definition locale
 * @param {string | URL} locationBase - i18n definition url location
 * @returns {I18nMergeIntermediaryResult} updated accumulator
 */
function mergeLang (acc, i18nDefinition, language, locationBase) {
  const { translations, import: ext } = i18nDefinition
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
 * Reducer for {@link merge} function, prepares i18n merge before applying {@link mergeLang}
 * @param {I18nMergeIntermediaryResult} acc - accumulator
 * @param {I18nLangMergeData} mergeData - merge data
 * @returns {I18nMergeIntermediaryResult} updated accumulator
 */
function mergeReducer (acc, mergeData) {
  const { location, kind } = mergeData
  const locationStr = typeof location === 'string' ? location : location.href
  if (kind === 'definition') {
    const i18nDefinition = normalizeI18nDefinition(mergeData.data).result
    return mergeLang(acc, i18nDefinition, mergeData.language.toString(), location)
  }

  if (kind === 'translations') {
    const i18nDefinition = normalizeI18nDefinition(locationStr).result
    return mergeLang(acc, i18nDefinition, mergeData.language.toString(), location)
  }

  const i18nDefinitionMap = normalizeI18nDefinitionMap(mergeData.data).result
  return Object.entries(i18nDefinitionMap).reduce(
    (acc, [lang, def]) => mergeLang(acc, def, lang, location),
    acc)
}

/**
 * @param  {...I18nLangMergeData} data - data to merge
 * @returns {NormalizedI18nDefinitionMap} merged data
 */
function merge (...data) {
  const result = data.reduce(mergeReducer, {})

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
 * {@link merge} call thunk
 * @param {I18nLangMergeData[]} data - {@link merge} input
 * @returns {() => NormalizedI18nDefinitionMap} thunk that calls merge with `data` and memoizes it
 */
const mergeThunk = (data) => {
  let buildResult = () => {
    const result = merge(...data)
    buildResult = () => result
    return result
  }
  return () => buildResult()
}

/**
 * @param {I18nLangMergeData[]} data - current data to merge
 * @returns {Readonly<MergerInstance>} immutable merger instance
 */
const mergeInstance = (data) => Object.freeze({
  addMap: (i18nInfo, location) => mergeInstance([...data, { kind: 'map', data: i18nInfo, location }]),
  addDefinitionOnLanguage: (i18nDef, language, location) => mergeInstance([...data, { kind: 'definition', language, data: i18nDef, location }]),
  addTranslations: (location, language) => mergeInstance([...data, { kind: 'translations', language, location }]),
  build: mergeThunk(data),
})

export const builder = mergeInstance([])

/** @typedef {{[language: string]: {import: Set<string>,translations: Translations}}} I18nMergeIntermediaryResult */

/** @typedef {I18nMapMergeData | I18nDefinitionMergeData | I18nTranslationMergeData } I18nLangMergeData */

/**
 * @typedef {object} I18nMapMergeData
 * I18n definition map merge data
 * @property {'map'} kind - merge data type
 * @property {I18nDefinitionMap} data - i18n definition map data
 * @property {URL | string} location - i18n definition map location
 */

/**
 * @typedef {object} I18nDefinitionMergeData
 * @property {'definition'} kind - merge data type
 * @property {I18nDefinition} data - i18n definition data
 * @property {URL | string} location - i18n definition location
 * @property {Intl.Locale | string} language - i18n definition locale
 */

/**
 * @typedef {object} I18nTranslationMergeData
 * @property {'translations'} kind - merge data type
 * @property {URL | string} location - translations map location
 * @property {Intl.Locale | string} language - translations map locale
 */

/**
 * @typedef {object} MergerInstance
 * Constains api to add data to merge or merge with the current data
 * @property {(i18nInfo: I18nDefinitionMap, location: URL | string) => MergerInstance} addMap - add map of locale to i18n definition to merge
 * @property {(i18nDef: I18nDefinition, language: Intl.Locale | string, location: URL | string) => MergerInstance} addDefinitionOnLanguage - add i18n definition map in a specific locale to merge
 * @property {(location: URL | string, language: Intl.Locale | string) => MergerInstance} addTranslations - add url location of a translation map in a specific locale to merge
 * @property {() => NormalizedI18nDefinitionMap} build - merge current data
 */

/** @typedef {import ('../i18n-normalizer/i18n-normalizer.js').I18nDefinitionMap} I18nDefinitionMap */
/** @typedef {import ('../i18n-normalizer/i18n-normalizer.js').Translations} Translations */
/** @typedef {import ('../i18n-normalizer/i18n-normalizer.js').I18nDefinition} I18nDefinition */
/** @typedef {import ('../i18n-normalizer/i18n-normalizer.js').NormalizedI18nDefinition} NormalizedI18nDefinition */
/** @typedef {import ('../i18n-normalizer/i18n-normalizer.js').NormalizedI18nDefinitionMap} NormalizedI18nDefinitionMap */
