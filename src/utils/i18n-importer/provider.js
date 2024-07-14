/** @import { importTranslations, importDefinitionMap } from './i18n-importer.js' */

/** @type {Implementation} */
const defaultImplementation = Object.freeze({
  importTranslations: () => ((console.error('importTranslations not implemented'), Promise.resolve({}))),
  importDefinitionMap: () => ((console.error('importLanguage not implemented'), Promise.resolve({}))),
})

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
 * @typedef {object} Implementation
 * @property {typeof importTranslations} importTranslations - {@link importTranslations} implementation function
 * @property {typeof importDefinitionMap} importDefinitionMap - {@link importTranslations} implementation function
 */
