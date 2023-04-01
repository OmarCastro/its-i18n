export type Translations = Record<string, string>

export type NormalizedI18nDefinition = {
  extends: string[]
  translations: Translations
}

export type NormalizedI18nDefinitionMap = Record<string, NormalizedI18nDefinition>

export type I18nDefinition =
  | string
  | string[]
  | {
    extends?: string[] | string
    translations: Translations
  }
  | {
    extends: string[] | string
    translations?: Translations
  }

export type I18nDefinitionMap = Record<string, I18nDefinition>

type ErrorList = {
  path: string
  message: string
}[]

const typeOf = (targetVar: unknown) => targetVar == null ? String(targetVar) : typeof targetVar
const isPlainObject = (value): value is Record<string, unknown> => value?.constructor === Object
const properyPath = (propName: string) => /^[a-z][a-z\d]*$/i.test(propName) ? `.${propName}` : `.[${JSON.stringify(propName)}]`
const mergePath = (prop1: string, prop2: string) => prop1 + (prop2 === '.' || prop2.startsWith('.[') ? prop2.substring(1) : prop2)

export function validateImportPath(path: string): { valid: boolean; error?: string } {
  if (typeof path !== 'string') {
    return { valid: false, error: `expected string instead of ${typeOf(path)}` }
  }
  if (path === '') {
    return { valid: false, error: `cannot import empty path` }
  }
  return { valid: true }
}

function normalizeExtendsArray(extendsArray: string[]): { result: typeof extendsArray; errors: ErrorList } {
  const result = [] as typeof extendsArray
  const errors = [] as ErrorList
  for (const [index, importPath] of extendsArray.entries()) {
    const checkResult = validateImportPath(importPath)
    if (!checkResult.valid) {
      errors.push({ path: `.[${index}]`, message: `${checkResult.error}, ignoring extends` })
      continue
    }
    result.push(importPath)
  }
  return { result, errors }
}

function normalizesExtendsValue(extdensVal: unknown): { result: string[]; errors: ErrorList } {
  if (extdensVal === '') {
    return { result: [], errors: [{ path: '', message: `cannot import empty path, ignoring extends` }] }
  }

  if (typeof extdensVal === 'string') {
    return { result: [extdensVal], errors: [] }
  }

  if (Array.isArray(extdensVal)) {
    return normalizeExtendsArray(extdensVal)
  }

  return {
    result: [],
    errors: [{ path: '', message: `expected string or string array (string[]) instead of ${typeOf(extdensVal)}` }],
  }
}

export function normalizeTranslations(translations: Translations): { result: Translations; errors: ErrorList } {
  if (!isPlainObject(translations)) {
    return {
      result: {},
      errors: [{ path: '', message: `expected a plain object instead of ${typeOf(translations)}` }],
    }
  }

  const result = {}
  const errors = [] as ErrorList

  for (const [key, value] of Object.entries(translations)) {
    if (typeof value !== 'string') {
      errors.push({ path: properyPath(key), message: `expected string instead of ${typeOf(value)}` })
      continue
    }
    result[key] = value
  }

  return { result, errors }
}

/**
 * Normalizes the i18n definition model data
 *
 * @param data - target i18n definition to be normalized
 *
 * @returns normalized i18n definition
 */
export function normalizeI18nDefinition(data: I18nDefinition): { result: NormalizedI18nDefinition; errors: ErrorList } {
  if (data === '') {
    return {
      result: { extends: [], translations: {} },
      errors: [{ path: '', message: `cannot import empty path, ignoring extends` }],
    }
  }

  if (typeof data === 'string') {
    return { result: { extends: [data], translations: {} }, errors: [] }
  }

  if (Array.isArray(data)) {
    const extendsArrayResult = normalizeExtendsArray(data)
    const errors = extendsArrayResult.errors
    const result = { extends: extendsArrayResult.result, translations: {} }
    return { result, errors }
  }

  if (!isPlainObject(data)) {
    return { result: { extends: [], translations: {} }, errors: [{ path: '', message: `invalid type` }] }
  }

  let extendsValue = [] as NormalizedI18nDefinition['extends']
  const tranlsationValue = {} as NormalizedI18nDefinition['translations']
  const errors = [] as ErrorList
  const hasExtends = Object.hasOwn(data, 'extends')
  const hasTranslations = Object.hasOwn(data, 'translations')

  if (hasExtends) {
    const extendsValueResult = normalizesExtendsValue(data.extends)
    errors.push(...extendsValueResult.errors.map(({ path, message }) => ({ path: mergePath('.extends', path), message })))
    extendsValue = extendsValueResult.result
  }

  if (hasTranslations) {
    if (isPlainObject(data.translations)) {
      Object.entries(data.translations).forEach(([key, value]) => {
        tranlsationValue[key] = value
      })
    }
  }

  if (hasExtends || hasTranslations) {
    return {
      result: { extends: extendsValue, translations: tranlsationValue },
      errors,
    }
  }

  return {
    result: { extends: [], translations: {} },
    errors: [{ path: '', message: `invalid object, the object must have "extends" or "translation" keys` }],
  }
}

/**
 * Normalizes the i18n definition map
 *
 * @param data - target i18n definition map to be normalized
 *
 * @returns normalized i18n definition map
 */
export function normalizeI18nDefinitionMap(
  data: I18nDefinitionMap,
): { result: NormalizedI18nDefinitionMap; warnings: ErrorList; errors: ErrorList } {
  const result = {} as NormalizedI18nDefinitionMap
  const errors = [] as ErrorList
  const warnings = [] as ErrorList

  for (const [localeString, i18nDefninition] of Object.entries(data)) {
    let locale: Intl.Locale
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
      } else {
        warnings.push({
          path: properyPath(localeString),
          message: `invalid locale "${localeString}", fixed to locale "${baseName}"`,
        })
      }
    }

    const normalizedResult = normalizeI18nDefinition(i18nDefninition)
    if (normalizedResult.errors.length) {
      const propPath = properyPath(localeString)
      errors.push(...normalizedResult.errors.map(({ path, message }) => ({ path: mergePath(propPath, path), message })))
    }
    result[baseName] = normalizedResult.result
  }

  return { result, warnings, errors }
}
