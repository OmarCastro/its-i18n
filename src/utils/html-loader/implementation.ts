import { importI18nJson } from "../i18n-importer/mod.ts"
import { i18nTanslationStore, type TranslationStore } from "../store/translation-store.ts"

export function loadI18n(document: Document): Promise<TranslationStore> {

  const store = i18nTanslationStore()
  const deferrdPromises = [] as Promise<unknown>[]

  const location = window.location.href;

  document.querySelectorAll('link[rel="i18n-language-map"]').forEach(link => {
    const href = link.getAttribute("href")!
    const deferredLoad = importI18nJson(href, window.location.href).then(data => store.loadTranslations({languages: data, location: location}))
    deferrdPromises.push(deferredLoad)
    
  })

  return Promise.all(deferrdPromises).then(() => store)
}

