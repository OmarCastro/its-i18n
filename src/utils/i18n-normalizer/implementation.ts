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

function normalizeExtendsArray(extendsArray: string[]) {
  const result = [] as typeof extendsArray
  for (const importPath of extendsArray) {
    result.push(importPath)
  }
  return result
}

/**
 * Normalizes the i18n definition model data
 * @param data
 * @returns
 */
export function normalizeI18nDefinition(data: NonNormalizedI18nDefinition): NormalizedI18nDefinition {
  const translations = {}
  if (typeof data === 'string') {
    return { extends: [data], translations }
  }

  if (Array.isArray(data)) {
    return { extends: normalizeExtendsArray(data), translations }
  }

  const { extends: extdensVal, translations: translationsVal } = data
  if (translationsVal != null) {
    Object.entries(translationsVal).forEach(([key, val]) => translations[key] = val)
  }

  if (typeof extdensVal === 'string') {
    return { extends: [extdensVal], translations }
  }

  if (Array.isArray(extdensVal)) {
    return { extends: normalizeExtendsArray(extdensVal), translations }
  }

  return { extends: [], translations }
}

function normalizeI18nInfoDefinitionMap(data: NonNormalizedI18nDefinitionMap): NormalizedI18nDefinitionMap {
  return Object.fromEntries(
    Object.entries(data).map(
      ([lang, i18nDefninition]) => [lang, normalizeI18nDefinition(i18nDefninition)],
    ),
  )
}
