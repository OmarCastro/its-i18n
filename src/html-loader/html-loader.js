import { importDefinitionMap } from '../utils/i18n-importer/i18n-importer.js'
import { i18nTanslationStore } from '../utils/store/translation-store.js'
import { builder } from '../utils/i18n-merger/i18n-merger.util.js'

/**
 * Adds locale maps to mergeInstance
 * @param {object} params - parameters
 * @param {Document} params.document - DOM document
 * @param {BaseURL} params.location - i18n locale map location
 * @param {typeof builder} params.merger - merge instance
 * @returns {Promise<typeof builder>} resulting mergeInstance
 */
async function loadLocaleMaps ({ document, location, merger }) {
  const locationHref = location.href
  const localeMaps = Array.from(document.querySelectorAll('link[rel="i18n-locale-map"]'))
  if (localeMaps.length <= 0) {
    return merger
  }

  const deferredMapPromises = localeMaps.flatMap((link) => {
    const href = link.getAttribute('href')
    if (!href) return []
    return [importDefinitionMap(href, locationHref).then((result) => ({ result, location: new URL(href, locationHref) }))]
  })

  const promiseResults = await Promise.allSettled(deferredMapPromises)
  return promiseResults.reduce((merger, settled) => {
    if (settled.status === 'rejected') {
      console.error('error loading file: %o', settled.reason)
      return merger
    }
    const { result, location } = settled.value
    return merger.addMap(result, location)
  }, merger)
}

/**
 * Adds translations to mergeInstance
 * @param {object} params - parameters
 * @param {Document} params.document - DOM document
 * @param {BaseURL} params.location - i18n translation location
 * @param {typeof builder} params.merger - merge instance
 * @returns {typeof builder} - resulting mergeInstance
 */
function loadTranslations ({ document, location, merger }) {
  const locationHref = location.href
  const translationsMaps = document.querySelectorAll('link[rel="i18n-translation-map"]')
  if (translationsMaps.length <= 0) { return merger }

  return [...translationsMaps].reduce((merger, link) => {
    const href = link.getAttribute('href')
    const lang = link.getAttribute('lang')
    if (href == null) {
      console.error('link %o requires a href attribute, it will be ignored', link)
      return merger
    }
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

/**
 * Loads i18n from the DOM
 * @param {object} params - loadI18n parameters
 * @param {Document} params.document         - DOM document
 * @param {BaseURL | string} params.location - i18n location
 * @returns {Promise<import('../utils/store/translation-store.js').TranslationStore>} - loaded store
 */
export async function loadI18n ({ document, location } = window) {
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

/** @typedef {{href: string}} BaseURL - any type that has `href`, like {@link URL} and {@link window.location} */
