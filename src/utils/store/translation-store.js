import { importTranslations } from '../i18n-importer/i18n-importer.js'
import { normalizeI18nDefinitionMap } from '../i18n-normalizer/i18n-normalizer.js'

const emptyObj = Object.freeze({})
const intialDataStore = Object.freeze({
  languages: emptyObj,
  location: '',
})

/**
 * @param {string} locale - target locale string
 * @returns true if sting is a valid locale, false otherwise
 */
const isLocale = (locale) => {
  try {
    (() => new Intl.Locale(locale))()
    return true
  } catch {
    return false
  }
}

/**
 * Normalizes `StoreDataEntry.data`
 * @param {StoreDataEntry} data
 */
function normalizeTranslationData (data) {
  const normalizedLanguages = normalizeI18nDefinitionMap(data.languages)
  normalizedLanguages.errors.forEach((error) => console.error('Error on %s::%s, %s', data.location, error.path, error.message))
  normalizedLanguages.warnings.forEach((error) => console.warn('Warning on %s::%s, %s', data.location, error.path, error.message))
  return {
    location: data.location,
    languages: structuredClone(normalizedLanguages.result),
  }
}

/** @type {WeakMap<TranslationStore, Record<string, Translations>>} */
const memoizedTranslationsMap = new WeakMap()

/**
 *
 * @param {TranslationStore} store
 */
function getMemoizedTranslations (store) {
  const memoizedTranslations = memoizedTranslationsMap.get(store)
  if (memoizedTranslations) {
    return memoizedTranslations
  }
  /** @type {Record<string, Translations>} */
  const newMemo = {}
  memoizedTranslationsMap.set(store, newMemo)
  return newMemo
}

/**
 *
 * @param {TranslationStore} store
 * @param {string} locale
 * @returns {Promise<Translations>}
 */
const getTranslationsFromData = async (store, locale) => {
  const computed = getMemoizedTranslations(store)
  if (computed[locale]) {
    return computed[locale]
  }
  const definition = store.data.languages[locale]
  if (!definition) {
    return {}
  }
  if (!Array.isArray(definition.extends) || definition.extends.length <= 0) {
    return definition.translations
  }
  const translationsPromises = definition.extends.map(extend => isLocale(extend)
    ? getTranslationsFromData(store, extend)
    : importTranslations(extend, store.data.location),
  )
  const translationsArray = await Promise.all(translationsPromises)
  const importedTranslations = translationsArray.reduce((acc, translations) => ({ ...acc, ...translations }))

  computed[locale] = {
    ...importedTranslations,
    ...definition.translations,
  }
  return computed[locale]
}

/** @type {TranslationStore} */
const StorePrototype = {

  loadTranslations (data) {
    this.data = normalizeTranslationData(data)
    memoizedTranslationsMap.delete(this)
  },

  async translationsFromLanguage (locale) {
    if (typeof locale === 'string') {
      return await this.translationsFromLanguage(new Intl.Locale(locale))
    }
    if (!memoizedTranslationsMap.has(this)) {
      memoizedTranslationsMap.set(this, {})
    }
    const memoizedTranslations = getMemoizedTranslations(this)

    if (memoizedTranslations[locale.baseName]) {
      return memoizedTranslations[locale.baseName]
    }
    const languages = [locale.baseName]
    const intlLang = locale.language
    if (locale.region != null) {
      const langRegion = `${intlLang}-${locale.region}`
      if (!languages.includes(langRegion)) {
        languages.push(langRegion)
      }
    }
    if (!languages.includes(intlLang)) {
      languages.push(intlLang)
    }
    const translationsPromises = languages.reverse().map(language => getTranslationsFromData(this, language))
    const translationsArray = await Promise.all(translationsPromises)
    const result = translationsArray.reduce((acc, translations) => ({ ...acc, ...translations }))
    memoizedTranslations[locale.baseName] = result
    return result
  },
  data: intialDataStore,
}

/**
 * Creates a translation store
 * @returns {TranslationStore} new translation store
 */
export function i18nTanslationStore () {
  return Object.create(StorePrototype)
}

//= == Type declarations

/** @typedef {import('../i18n-normalizer/i18n-normalizer.js').I18nDefinitionMap} I18nDefinitionMap */
/** @typedef {import('../i18n-normalizer/i18n-normalizer.js').NormalizedI18nDefinitionMap} NormalizedI18nDefinitionMap */

/** @typedef {import('../i18n-normalizer/i18n-normalizer.js').Translations} Translations */

/**
 * @typedef {object} StoreData
 *
 * Data of {@link TranslationStore}
 *
 * @property {NormalizedI18nDefinitionMap} languages - Store data languages
 * @property {string} location - location of stored data, used to get relative path to load additional i18n files
 */

/**
 * @typedef {object} StoreDataEntry
 *
 * Data to used to save in {@link TranslationStore}, it will be normalized to  {@link StoreData} on {@link TranslationStore.loadTranslations} call
 *
 * @property {I18nDefinitionMap} languages - Store data languages
 * @property {string} location - location of stored data, used to get relative path to load additional i18n files
 */

/**
 * @typedef {object} TranslationStore
 *
 * Data to used to save in {@link TranslationStore}, it will be normalized to  {@link StoreData} on {@link TranslationStore.loadTranslations} call
 *
 * @property {(data: StoreDataEntry) => void} loadTranslations - loads translations in data
 * @property {TranslationsFromLanguage} translationsFromLanguage - get stored translations from a locale
 * @property {StoreData} data - Store data where all infomation is saved with loadTranslations()
 */

/**
 * @callback TranslationsFromLanguage
 * @param {string | Intl.Locale} locale - Intl.Locale of a string definition
 * @returns {Promise<Translations>} empty locale, if locale string invalid, otherwise all translations from language
 */
