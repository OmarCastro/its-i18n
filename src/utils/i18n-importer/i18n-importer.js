import { implementation } from './provider.js'

/** @type {ImportTranslations} */
export const importTranslations = (url, base) => implementation.importTranslations(url, base)

/** @type {ImportI18nJson} */
export const importI18nJson = (url, base) => implementation.importI18nJson(url, base)

/** @typedef {import('./provider.js').ImportTranslations} ImportTranslations */
/** @typedef {import('./provider.js').ImportI18nJson} ImportI18nJson */
/** @typedef {import('./provider.js').I18nDefinitionMap} I18nDefinitionMap */
/** @typedef {import('./provider.js').Translations} Translations */
