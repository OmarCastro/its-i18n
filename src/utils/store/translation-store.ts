import { importTranslations } from '../i18n-importer/i18n-importer.js'
import { normalizeI18nDefinitionMap, type NormalizedI18nDefinitionMap, type I18nDefinitionMap } from '../i18n-normalizer/i18n-normalizer.js' 

const emptyObj = Object.freeze({})
const intialDataStore = Object.freeze({
  languages: emptyObj,
  location: '',
}) as StoreData

const isLocale = (locale: string) => {
  try {
    new Intl.Locale(locale)
    return true
  } catch {
    return false
  }
}

function normalizeTranslationData(data: StoreDataEntry) {
  const normalizedLanguages = normalizeI18nDefinitionMap(data.languages)
  normalizedLanguages.errors.forEach((error) => console.error('Error on %s::%s, %s', data.location, error.path, error.message))
  normalizedLanguages.warnings.forEach((error) => console.warn('Warning on %s::%s, %s', data.location, error.path, error.message))
  return {
    location: data.location,
    languages: structuredClone(normalizedLanguages.result)
  }
}

const memoizedTranslationsMap: WeakMap<TranslationStore, Record<string, Translations>> = new WeakMap()

const getTranslationsFromData = async (store: TranslationStore, locale: string): Promise<Translations> => {
  const computed = memoizedTranslationsMap.get(store)!
  if (computed[locale]) {
    return computed[locale]
  }
  const definition = store.data.languages[locale]
  if (!definition) return {}
  if (!Array.isArray(definition.extends) || definition.extends.length <= 0) {
    return definition.translations
  }
  const translationsPromises = definition.extends.map(extend => isLocale(extend) ? 
    getTranslationsFromData(store, extend) :
    importTranslations(extend, store.data.location)
  )
  const translationsArray = await Promise.all(translationsPromises)
  const importedTranslations = translationsArray.reduce((acc, translations) => ({...acc, ...translations}))

  computed[locale] = {
    ...importedTranslations,
    ...definition.translations,
  }
  return computed[locale]
}

const StorePrototype = {
  loadTranslations(data) {
    this.data = normalizeTranslationData(data)
    memoizedTranslationsMap.delete(this)
  },

  async translationsFromLanguage(locale): Promise<Translations> {
    if (typeof locale == 'string') {
      return await this.translationsFromLanguage(new Intl.Locale(locale))
    }
    if (!memoizedTranslationsMap.has(this)) {
      memoizedTranslationsMap.set(this, {})
    }
    const memoizedTranslations = memoizedTranslationsMap.get(this)!

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
    const result = {}
    for (const language of languages.reverse()) {
      const translations = await getTranslationsFromData(this, language)
      Object.assign(result, translations)
    }
    memoizedTranslations[locale.baseName] = result
    return result
  },
  data: intialDataStore,
} as TranslationStore

/**
 * Creates a translation store
 */
export function i18nTanslationStore(): TranslationStore {
  return Object.create(StorePrototype)
}

//=== Type declarations

type Translations = Record<string, string>

export type StoreData = {
  /**
   * Store data languages
   */
  languages: NormalizedI18nDefinitionMap
  /**
   * location of stored data, used to get relative path to load additional i18n files
   */
  location: string
}

export type StoreDataEntry = {
  /**
   * Store data languages
   */
  languages: I18nDefinitionMap
  /**
   * location of stored data, used to get relative path to load additional i18n files
   */
  location: string
}

export type TranslationStore = {
  /**
   * loads translations in data
   */
  loadTranslations(this: TranslationStore, data: StoreDataEntry): void

  /**
   * @param locale - Intl.Locale of a string definition
   * @returns {} if locale as string is an invalid locale
   * @returns all translations from language
   */
  translationsFromLanguage(this: TranslationStore, locale: string | Intl.Locale): Promise<Translations>

  /**
   * Store data where all infomation is saved with loadTranslations()
   */
  data: StoreData
}
