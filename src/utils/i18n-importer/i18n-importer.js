import { implementation } from './provider.js'

/**
 * Imports a {@link Translations} from an URL
 * @param {string | URL} url - target URL
 * @param {string | URL} base - Base URL to use when `url` uses relative url
 * @returns {Promise<Translations>} promise that results imported {@link Translations} object on finish
 */
export const importTranslations = (url, base) => implementation.importTranslations(url, base)

/**
 * Imports a {@link I18nDefinitionMap} from an URL
 * @param {string | URL} url - target URL
 * @param {string | URL} base - Base URL to use when `url` uses relative url
 * @returns {Promise<I18nDefinitionMap>} promise that results imported {@link I18nDefinitionMap} object on finish
 */
export const importDefinitionMap = (url, base) => implementation.importDefinitionMap(url, base)

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
