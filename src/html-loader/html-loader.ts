import { importI18nJson } from '../utils/i18n-importer/i18n-importer.js'
import { i18nTanslationStore, type TranslationStore } from '../utils/store/translation-store.js'
import { builder } from '../utils/i18n-merger/i18n-merger.util.js'

async function loadLocaleMaps({ document, location, merger }: LoadPartParameters) {
  const locationHref = location.href

  const localeMaps = Array.from(document.querySelectorAll('link[rel="i18n-locale-map"]'))
  if (localeMaps.length <= 0) {
    return merger
  }

  const deferredMapPromises = localeMaps.flatMap((link) => {
    const href = link.getAttribute('href')
    if(!href) return []
    
    return [importI18nJson(href, locationHref).then((result) => ({result, location: new URL(href, locationHref)}))]
  })

  const promiseResults = await Promise.allSettled(deferredMapPromises)

  return promiseResults.reduce((merger, settled) => {
    if (settled.status === 'rejected') {
      console.error('error loading file: %o', settled.reason)
      return merger
    }
    const {result, location} = settled.value
    return merger.addMap(result, location)
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
