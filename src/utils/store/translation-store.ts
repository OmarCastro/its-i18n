import { importTranslations } from '../i18n-importer/i18n-importer.js'

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

function normalizeTranslationData(data: StoreData) {
  const originalLangs = data.languages
  const languages = {} as typeof originalLangs
  const result: StoreData = {
    location: data.location,
    languages,
  }

  for (const localeString of Object.keys(data.languages)) {
    let locale: Intl.Locale
    try {
      locale = new Intl.Locale(localeString)
    } catch {
      console.error(`Error: Invalid locale "${localeString}", it will not be added to the I18n store`)
      continue
    }
    const { baseName } = locale
    if (baseName !== localeString) {
      if (originalLangs[baseName]) {
        console.error(
          `Error: Invalid locale "${localeString}", it also conflicts with correct locale "${baseName}", it will not be added to the I18n store`,
        )
        continue
      } else {
        console.warn(`Warn: Invalid locale "${localeString}", fixed to locale "${baseName}"`)
      }
    }
    languages[baseName] = structuredClone(originalLangs[localeString])
  }
  return result
}

const memoizedTranslationsMap: WeakMap<TranslationStore, Record<string, Translations>> = new WeakMap()

const getTranslationsFromData = async (store: TranslationStore, locale: string): Promise<Translations> => {
  const computed = memoizedTranslationsMap.get(store)!
  if (computed[locale]) {
    return computed[locale]
  }
  const definition = store.data.languages[locale]
  if (!definition) return {}
  if (!definition.extends) {
    return definition.translations
  }
  const extendsArray = [].concat(definition.extends as never) as string[]
  const translationsFromExtends = {}
  for (const extend of extendsArray) {
    const translations = isLocale(extend)
      ? await getTranslationsFromData(store, extend)
      : await importTranslations(extend, store.data.location)
    Object.assign(translationsFromExtends, translations)
  }

  computed[locale] = {
    ...translationsFromExtends,
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

type TranslationsDefinition = {
  /**
   * `extends` variable saves a list of files to load, can be a string if it is to load a single file
   * When there are multiple files, the keys are merged, files in next value of the list overrides the previous
   * one in case of conflicts.
   */
  extends?: string | string[]
  /**
   * List of translations, merges with all keys from `extends`, overriding any conflicting key in case of conflicts
   */
  translations: Translations
}

export type StoreData = {
  /**
   * Store data languages
   */
  languages: Record<string, TranslationsDefinition>
  /**
   * location of stored data, used to get relative path to load additional i18n files
   */
  location: string
}

export type TranslationStore = {
  /**
   * loads translations in data
   */
  loadTranslations(this: TranslationStore, data: StoreData): void

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
