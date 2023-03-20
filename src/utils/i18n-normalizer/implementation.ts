type Translations = Record<string, string>

type NormalizedI18nDefinition = {
  extends: string[]
  translations: Translations
}

type NormalizedI18nDefinitionMap = Record<string, NormalizedI18nDefinition>


type NonNormalizedI18nDefinition = {
  extends?: string[] | string
  translations: Translations
} | {
  extends: string[] | string
  translations?: Translations
}

type NonNormalizedI18nDefinitionMap = Record<string, NormalizedI18nDefinition>


function normalizeI18nDefinition(data: NonNormalizedI18nDefinition): NormalizedI18nDefinition{
  const extensions = [] as string[]
  const translations = {}
  const {extends: extdensVal, translations: translationsVal} = data
  if(typeof extdensVal === "string"){
    extensions.push(extdensVal)
  } else if(Array.isArray(extdensVal)){
    for(const ext of extdensVal){
      extensions.push(ext)
    }
  }

  if(translationsVal != null){
    Object.entries(translationsVal).forEach(([key, val]) => translations[key] = val)
  }
  return {extends: extensions, translations}

}

function normalizeI18nInfoDefinitionMap(data: NonNormalizedI18nDefinitionMap): NormalizedI18nDefinitionMap{
  return Object.fromEntries(
    Object.entries(data).map(
      ([lang, i18nDefninition]) => [lang, normalizeI18nDefinition(i18nDefninition)]
    )
  )
}
