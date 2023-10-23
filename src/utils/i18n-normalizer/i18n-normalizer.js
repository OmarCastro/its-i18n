/**
 * Checks if import path is valid
 * @param {string} path - target import path
 * @returns {{ valid: true } | { valid: false, error: string }} validation result
 */
export function validateImportPath (path) {
  if (typeof path !== 'string') {
    return { valid: false, error: `expected string instead of ${typeOf(path)}` }
  }
  if (path === '') {
    return { valid: false, error: 'cannot import empty path' }
  }
  return { valid: true }
}

/**
 * Normalize Import Array, eliminating invalid import paths
 * @param {string[]} importArray - import list
 * @returns {{ result: string[]; errors: ErrorList }} normalized data with a list of errors found
 */
function normalizeImportArray (importArray) {
  const result = []
  const errors = []
  for (const [index, importPath] of importArray.entries()) {
    const checkResult = validateImportPath(importPath)
    if (!checkResult.valid) {
      errors.push({ path: `.[${index}]`, message: `${checkResult.error}, ignoring import` })
      continue
    }
    result.push(importPath)
  }
  return { result, errors }
}

/**
 * Normalize Import string, into an normalized import array
 * @param {unknown} importVal - import data
 * @returns {{ result: string[]; errors: ErrorList }} normalized data with a list of errors found
 */
function normalizesImportValue (importVal) {
  if (importVal === '') {
    return { result: [], errors: [{ path: '', message: 'cannot import empty path, ignoring import' }] }
  }

  if (typeof importVal === 'string') {
    return { result: [importVal], errors: [] }
  }

  if (Array.isArray(importVal)) {
    return normalizeImportArray(importVal)
  }

  return {
    result: [],
    errors: [{ path: '', message: `expected string or string array (string[]) instead of ${typeOf(importVal)}` }],
  }
}

/**
 * Normalize Translations, eliminatin invalid entries
 * @param {Translations} [translations] - translation data
 * @returns {{ result: Translations; errors: ErrorList }} normalized data with a list of errors found
 */
export function normalizeTranslations (translations) {
  if (!isPlainObject(translations)) {
    return {
      result: {},
      errors: [{ path: '', message: `expected a plain object instead of ${typeOf(translations)}` }],
    }
  }

  const validEntries = []
  const errors = []

  for (const [key, value] of Object.entries(translations)) {
    if (typeof value !== 'string') {
      errors.push({ path: properyPath(key), message: `expected string instead of ${typeOf(value)}` })
      continue
    }
    validEntries.push([key, value])
  }

  return { result: Object.fromEntries(validEntries), errors }
}

/**
 * Normalizes the i18n definition model data
 * @param {I18nDefinition} data - target i18n definition to be normalized
 * @returns {{ result: NormalizedI18nDefinition; errors: ErrorList }} normalized i18n definition with a list of errors found
 */
export function normalizeI18nDefinition (data) {
  if (data === '') {
    return {
      result: { import: [], translations: {} },
      errors: [{ path: '', message: 'cannot import empty path, ignoring import' }],
    }
  }

  if (typeof data === 'string') {
    return { result: { import: [data], translations: {} }, errors: [] }
  }

  if (Array.isArray(data)) {
    const importArrayResult = normalizeImportArray(data)
    const errors = importArrayResult.errors
    const result = { import: importArrayResult.result, translations: {} }
    return { result, errors }
  }

  if (!isPlainObject(data)) {
    return { result: { import: [], translations: {} }, errors: [{ path: '', message: 'invalid type' }] }
  }

  const errors = []
  const hasimport = Object.hasOwn(data, 'import')
  const hasTranslations = Object.hasOwn(data, 'translations')

  const importValue = (() => {
    if (!hasimport) { return [] }
    const importValueResult = normalizesImportValue(data.import)
    errors.push(...importValueResult.errors.map(({ path, message }) => ({ path: mergePath('.import', path), message })))
    return importValueResult.result
  })()

  const translationsValue = (() => {
    if (!hasTranslations) { return {} }
    const translationsValueResult = normalizeTranslations(data.translations)
    errors.push(...translationsValueResult.errors.map(({ path, message }) => ({ path: mergePath('.translations', path), message })))
    return translationsValueResult.result
  })()

  if (hasimport || hasTranslations) {
    return {
      result: { import: importValue, translations: translationsValue },
      errors,
    }
  }

  return {
    result: { import: [], translations: {} },
    errors: [{ path: '', message: 'invalid object, the object must have "import" or "translations" keys' }],
  }
}

/**
 * Normalizes the i18n definition map
 * @param {I18nDefinitionMap} data - target i18n definition map to be normalized
 * @returns {NormalizationResult} normalized i18n definition map
 */
export function normalizeI18nDefinitionMap (data) {
  const errors = []
  const warnings = []
  const normalizedEntries = []

  for (const [localeString, i18nDefninition] of Object.entries(data)) {
    let locale
    try {
      locale = new Intl.Locale(localeString)
    } catch {
      errors.push({
        path: properyPath(localeString),
        message: `invalid locale "${localeString}", it will be ignored`,
      })
      continue
    }

    const { baseName } = locale
    if (baseName !== localeString) {
      if (data[baseName]) {
        errors.push({
          path: properyPath(localeString),
          message: `invalid locale "${localeString}", it also conflicts with correct locale "${baseName}", it will be ignored`,
        })
        continue
      }

      warnings.push({
        path: properyPath(localeString),
        message: `invalid locale "${localeString}", fixed to locale "${baseName}"`,
      })
    }

    const normalizedResult = normalizeI18nDefinition(i18nDefninition)
    if (normalizedResult.errors.length) {
      const propPath = properyPath(localeString)
      errors.push(...normalizedResult.errors.map(({ path, message }) => ({ path: mergePath(propPath, path), message })))
    }

    normalizedEntries.push([baseName, normalizedResult.result])
  }

  return { result: Object.fromEntries(normalizedEntries), warnings, errors }
}

/**
 * @param {unknown} targetVar - target object
 * @returns {string} type of object, returns "null" istead of "object" for null value
 */
const typeOf = (targetVar) => targetVar == null ? String(targetVar) : typeof targetVar

/**
 * @param {unknown} value - target object
 * @returns {value is Record<string, unknown>} true if plain object, false otherwise
 */
const isPlainObject = (value) => value?.constructor === Object

/**
 * Transforms property name to a valid property path so it can be used to chain with other properties
 * @param {string} propName - object property key
 * @returns {string} .`propName` for simple popery names, otherwise .[`propName`]
 */
const properyPath = (propName) => /^[a-z][a-z\d]*$/i.test(propName) ? `.${propName}` : `.[${JSON.stringify(propName)}]`

/**
 * Merge 2 propery paths
 * @param {string} prop1 - target property path
 * @param {string} prop2 - property path to merge with target
 * @returns {string} merged property path
 */
const mergePath = (prop1, prop2) => prop1 + (prop2 === '.' || prop2.startsWith('.[') ? prop2.substring(1) : prop2)

/// Type definitions

/** @typedef {Record<string, string>} Translations */

/** @typedef { { import: string[] , translations: Translations}} NormalizedI18nDefinition */

/** @typedef {Record<string, NormalizedI18nDefinition>} NormalizedI18nDefinitionMap */

/** @typedef {string | string[] | { import?: string[] | string, translations: Translations} | { import: string[] | string, translations?: Translations}} I18nDefinition */

/** @typedef {Record<string, I18nDefinition>} I18nDefinitionMap */

/** @typedef {{ path: string, message: string}[]} ErrorList */

/**
 * @typedef {object} NormalizationResult
 * @property {NormalizedI18nDefinitionMap} result - normalized value
 * @property {ErrorList} warnings - errors found but automatically fixed (e.g. locale en-UK fixed to en-GB)
 * @property {ErrorList} errors - non-fixable errors found
 */
