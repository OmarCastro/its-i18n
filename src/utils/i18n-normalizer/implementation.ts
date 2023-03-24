type Translations = Record<string, string>

type NormalizedI18nDefinition = {
  extends: string[]
  translations: Translations
}

type NormalizedI18nDefinitionMap = Record<string, NormalizedI18nDefinition>

type NonNormalizedI18nDefinition =
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

type NonNormalizedI18nDefinitionMap = Record<string, NormalizedI18nDefinition>

type ErrorList = {
  path: string
  message: string
}[]

const typeOf = (targetVar: unknown) => targetVar == null ? String(targetVar) : typeof targetVar

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
      errors.push({ path: `[${index}]`, message: `${checkResult.error}, ignoring extends` })
      continue
    }
    result.push(importPath)
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
export function normalizeI18nDefinition(data: NonNormalizedI18nDefinition): { result: NormalizedI18nDefinition; errors: ErrorList } {
  const translations = {}

  if (data === '') {
    return { result: { extends: [], translations }, errors: [{ path: '', message: `cannot import empty path, ignoring extends` }] }
  }

  if (typeof data === 'string') {
    return { result: { extends: [data], translations }, errors: [] }
  }

  if (Array.isArray(data)) {
    const extendsArrayResult = normalizeExtendsArray(data)
    const errors = extendsArrayResult.errors
    const result = { extends: extendsArrayResult.result, translations }
    return { result, errors }
  }

  const { extends: extdensVal, translations: translationsVal } = data
  if (translationsVal != null) {
    Object.entries(translationsVal).forEach(([key, val]) => translations[key] = val)
  }

  if (extdensVal === '') {
    return { result: { extends: [], translations }, errors: [{ path: '.extends', message: `cannot import empty path, ignoring extends` }] }
  }

  if (typeof extdensVal === 'string') {
    return { result: { extends: [extdensVal], translations }, errors: [] }
  }

  if (Array.isArray(extdensVal)) {
    const extendsArrayResult = normalizeExtendsArray(extdensVal)
    const errors = extendsArrayResult.errors.map(({ path, message }) => ({ path: `.extends${path}`, message }))
    const result = { extends: extendsArrayResult.result, translations }
    return { result, errors }
  }

  if (Object.hasOwn(data, 'extends')) {
    return {
      result: { extends: [], translations },
      errors: [{ path: '.extends', message: `expected string or string array (string[]) instead of ${typeOf(extdensVal)}` }],
    }
  }

  return { result: { extends: [], translations }, errors: [{ path: '', message: `invalid type` }] }
}

/**
 * Normalizes the i18n definition map
 *
 * @param data - target i18n definition map to be normalized
 *
 * @returns normalized i18n definition map
 */
function normalizeI18nInfoDefinitionMap(data: NonNormalizedI18nDefinitionMap): { result: NormalizedI18nDefinition; errors: ErrorList } {
  return Object.entries(data).reduce((acc, [lang, i18nDefninition]) => {
    const normalizedResult = normalizeI18nDefinition(i18nDefninition)
    const langJsonPath = `[${JSON.stringify(lang)}]`
    const errors = normalizedResult.errors.map(({ path, message }) => ({ path: `${langJsonPath}${path}`, message }))
    acc.result[lang] = normalizedResult.result
    acc.errors.push(...errors)
    return acc
  }, { result: {}, errors: [] as ErrorList } as ReturnType<typeof normalizeI18nInfoDefinitionMap>)
}
