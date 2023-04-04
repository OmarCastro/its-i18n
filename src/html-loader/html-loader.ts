import { type I18nDefinitionMap, importI18nJson, importTranslations, type Translations } from '../utils/i18n-importer/mod.ts'
import { i18nTanslationStore, type StoreData, type TranslationStore } from '../utils/store/translation-store.ts'
import { builder } from '../utils/i18n-merger/mod.ts'

async function loadLocaleMaps({ document, location, merger }: LoadPartParameters) {
  const locationHref = location.href

  const localeMaps = document.querySelectorAll('link[rel="i18n-locale-map"]')
  if (localeMaps.length <= 0) {
    return merger
  }

  const deferredMapPromises = [] as Promise<[I18nDefinitionMap, URL]>[]

  localeMaps.forEach((link) => {
    const href = link.getAttribute('href')!
    deferredMapPromises.push(importI18nJson(href, locationHref).then((result) => [result, new URL(href, locationHref)]))
  })

  const promiseResults = await Promise.allSettled(deferredMapPromises)

  return promiseResults.reduce((merger, settled) => {
    if (settled.status === 'rejected') {
      console.error('error loading file: %o', settled.reason)
      return merger
    }
    return merger.addMap(...settled.value)
  }, merger)
}

function loadTranslations({ document, location, merger }: LoadPartParameters) {
  const locationHref = location.href

  const translationsMaps = document.querySelectorAll('link[rel="i18n-translation-map"]')
  if (translationsMaps.length <= 0) {
    return merger
  }

  return [...translationsMaps].reduce((merger, link) => {
    const href = link.getAttribute('href')!
    const lang = link.getAttribute('lang')
    if (lang == null) {
      console.error('link %o requires a lang attribute, it will be ignored', link)
      return merger
    }
    try {
      const locale = new Intl.Locale(lang)
      return merger.addTranslations(new URL(href, locationHref), locale)
    } catch {
      console.error(`invalid locale "${lang}", it will be ignored`)
    }
    return merger
  }, merger)
}

export async function loadI18n({ document, location }: LoadI18nParams = window): Promise<TranslationStore> {
  location = typeof location === 'string' ? new URL(location) : location
  const localeMapMerger = await loadLocaleMaps({ document, location, merger: builder })
  const finalMerger = loadTranslations({ document, location, merger: localeMapMerger })

  const store = i18nTanslationStore()

  store.loadTranslations({
    location: location.href,
    languages: finalMerger.build(),
  })

  return store
}

/** This type is compatible with both URL objects and window.location */
type BaseURL = {
  href: string
}

type LoadPartParameters = {
  document: Document
  location: BaseURL
  merger: typeof builder
}

type LoadI18nParams = {
  document: Document
  location: BaseURL | string
}
