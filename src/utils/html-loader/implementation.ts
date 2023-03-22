import { type I18nDefinitionMap, importI18nJson } from '../i18n-importer/mod.ts'
import { i18nTanslationStore, type StoreData, type TranslationStore } from '../store/translation-store.ts'

export async function loadI18n(document: Document): Promise<TranslationStore> {
  const store = i18nTanslationStore()

  const deferrdPromises = [] as Promise<I18nDefinitionMap>[]

  const location = window.location.href

  const storeData = {
    location,
    languages: {},
  } as StoreData

  document.querySelectorAll('link[rel="i18n-locale-map"]').forEach((link) => {
    const href = link.getAttribute('href')!
    deferrdPromises.push(importI18nJson(href, window.location.href))
  })

  await Promise.allSettled(deferrdPromises).then((results) =>
    results.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('error loading file: %o', result.reason)
        return
      }
      Object.entries(result.value.languages ?? {})
      storeData.languages
    })
  )

  return store
}
