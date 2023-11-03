import { implementation } from './provider.js'

/** @type {ImportTranslations} */
export const importTranslations = (url, base) => implementation.importTranslations(url, base)

/** @type {ImportI18nJson} */
export const importDefinitionMap = (url, base) => implementation.importDefinitionMap(url, base)

/** @typedef {import('./provider.js').ImportTranslations} ImportTranslations */
/** @typedef {import('./provider.js').ImportDefinitionMap} ImportI18nJson */
