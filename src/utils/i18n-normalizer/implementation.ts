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
  path: string, 
  message: string
}[]

export function validateImportPath(path: string): {valid: boolean, error?: string} {
  if(typeof path !== "string"){
    return {valid: false, error:  `expected string, instead of ${typeof path}`}
  }
  if(path === ""){
    return {valid: false, error:  `cannot import empty path`}
  }
  return {valid: true}
}


function normalizeExtendsArray(extendsArray: string[]): { result: typeof extendsArray, errors: ErrorList } {
  const result = [] as typeof extendsArray
  const errors = [] as ErrorList
  for (const [index, importPath] of extendsArray.entries()) {
    const checkResult = validateImportPath(importPath)
    if(!checkResult.valid){
      errors.push({path: `[${index}]`, message: `${checkResult.error}, ignoring extends` })
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
export function normalizeI18nDefinition(data: NonNormalizedI18nDefinition): {result: NormalizedI18nDefinition, errors: ErrorList} {
  const translations = {}

  if(data === ''){
    return {result: {extends: [], translations}, errors:  [{path: "", message:`cannot import empty path, ignoring extends`}]}
  }

  if (typeof data === 'string') {
    return { result: {extends: [data], translations }, errors: []}
  }

  if (Array.isArray(data)) {
    const extendsArrayResult = normalizeExtendsArray(data)
    const errors = extendsArrayResult.errors.map(({path, message}) => ({path: `extends${path}` , message}))
    const result = { extends: extendsArrayResult.result, translations }
    return { result, errors }
  }

  const { extends: extdensVal, translations: translationsVal } = data
  if (translationsVal != null) {
    Object.entries(translationsVal).forEach(([key, val]) => translations[key] = val)
  }

  if (extdensVal === '') {
    return {result: {extends: [], translations}, errors:  [{path: "extends", message:`cannot import empty path, ignoring extends`}]}
  }

  if (typeof extdensVal === 'string') {
    return { result: {extends: [extdensVal], translations }, errors: []}
  }

  if (Array.isArray(extdensVal)) {
    const extendsArrayResult = normalizeExtendsArray(extdensVal)
    const errors = extendsArrayResult.errors.map(({path, message}) => ({path: `extends${path}` , message}))
    const result = { extends: extendsArrayResult.result, translations }
    return { result, errors }
  }

  return {result: {extends: [], translations}, errors:  [{path: "", message:`invalid type`}]}
}

/**
 * Normalizes the i18n definition map
 * 
 * @param data - target i18n definition map to be normalized
 * 
 * @returns normalized i18n definition map
 */
function normalizeI18nInfoDefinitionMap(data: NonNormalizedI18nDefinitionMap, context: any[] = []): NormalizedI18nDefinitionMap {
  return Object.fromEntries(
    Object.entries(data).map(
      ([lang, i18nDefninition]) => [lang, normalizeI18nDefinition(i18nDefninition).result],
    ),
  )
}
