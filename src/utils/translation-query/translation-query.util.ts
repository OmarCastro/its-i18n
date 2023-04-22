import { parseKey } from '../../key-parser/key-parser.util.ts'

type TranslationValue = string

type Translations = {
  [k: string]: TranslationValue
}

type QueryResult = {
  targetKey: string
  translations: Translations
  found: boolean
  value: TranslationValue
}

type OptimizedTranslations = {
  literalKeys: Translations
  prefixTemplateSearchByWords: {
    [prefix: string]: Translations
  }
}

function optimizeTranslationForQueries(translations: Translations) {
  const result: OptimizedTranslations = {
    literalKeys: {},
    prefixTemplateSearchByWords: {},
  }
  const { literalKeys, prefixTemplateSearchByWords } = result

  for (const [key, val] of Object.entries(translations)) {
    const parseResult = parseKey(key)
    if (parseResult.priority[0] <= 0) {
      literalKeys[key] = val
      continue
    }

    const prefix = parseResult.ast.tokens[0].text

    prefixTemplateSearchByWords[prefix] ||= {}
    prefixTemplateSearchByWords[prefix][key] = val
  }

  return result
}

export function queryFromTranslations(key: string, translations: Translations): QueryResult {
  if (translations[key] != null) {
    return {
      targetKey: key,
      translations,
      found: true,
      value: translations[key],
    }
  }

  return {
    targetKey: key,
    translations,
    found: false,
    value: key,
  }
}
