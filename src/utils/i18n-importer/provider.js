const defaultImplementation = Object.freeze({
  importTranslations: () => ((console.error('importTranslations not implemented'), Promise.resolve({}))),
  importDefinitionMap: () => ((console.error('importLanguage not implemented'), Promise.resolve({}))),
})

/** @type {Implementation} */
export const implementation = Object.seal({
  ...defaultImplementation,
})

/**
 * @param {Implementation} newImpl - new implementation to use on the application
 */
export function provide (newImpl) {
  if (typeof newImpl?.importTranslations === 'function') {
    implementation.importTranslations = newImpl.importTranslations
  }
  if (typeof newImpl?.importDefinitionMap === 'function') {
    implementation.importDefinitionMap = newImpl.importDefinitionMap
  }
}

/**
 * @typedef {Record<string, string>} Translations
 */

/**
 * @typedef {object} I18nDefinition
 * @property {string | string[]} [import]    - Additional files to import to the definition
 * @property {Translations}      translations - translaion map
 */

/**
 * @typedef {Record<string, I18nDefinition>} I18nDefinitionMap
 */

/**
 * @typedef {object} Implementation
 * @property {ImportTranslations} importTranslations - {@link ImportTranslations} implementation function
 * @property {ImportDefinitionMap} importDefinitionMap - {@link ImportTranslations} implementation function
 */

/**
 * @callback ImportTranslations
 *
 * Imports a {@link Translations} from an URL
 * @param {string | URL} url - target URL
 * @param {string | URL} base - Base URL to use when `url` uses relative url
 * @returns {Promise<Translations>} promise that results imported {@link Translations} object on finish
 */

/**
 * @callback ImportDefinitionMap
 *
 * Imports a {@link I18nDefinitionMap} from an URL
 * @param {string} url - target URL
 * @param {string} base - Base URL to use when `url` uses relative url
 * @returns {Promise<I18nDefinitionMap>} promise that results imported {@link I18nDefinitionMap} object on finish
 */
