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

type QueryResultCache = {
  [key: string]: QueryResult
}

type OptimizedTranslations = {
  literalKeys: Translations
  templateKeys: {
    [prefix: string]: {
      parsedKey: ReturnType<typeof parseKey>
      value: string
    }
  }
  templateKeysPriorityOrder: { key: string; priority: number }[]
  prefixTemplateSearchByWords: {
    [prefix: string]: Translations
  }
}

function optimizeTranslationForQueries(translations: Translations) {
  const result: OptimizedTranslations = {
    literalKeys: {},
    templateKeys: {},
    templateKeysPriorityOrder: [],
    prefixTemplateSearchByWords: {},
  }
  const { literalKeys, templateKeys, templateKeysPriorityOrder, prefixTemplateSearchByWords } = result

  for (const [key, val] of Object.entries(translations)) {
    const parseResult = parseKey(key)
    if (parseResult.priority[0] <= 0) {
      literalKeys[key] = val
      continue
    }

    templateKeys[key] = {
      parsedKey: parseResult,
      value: val,
    }
    templateKeysPriorityOrder.push({ key, priority: parseResult.priorityAsNumber })
    const prefix = parseResult.ast.tokens[0].text

    prefixTemplateSearchByWords[prefix] ||= {}
    prefixTemplateSearchByWords[prefix][key] = val
  }

  templateKeysPriorityOrder.sort((a, b) => b.priority - a.priority)

  return result
}

const translationOptimizations: WeakMap<Translations, { cache: QueryResultCache; optimizedMap: OptimizedTranslations }> = new WeakMap()

export function queryFromTranslations(key: string, translations: Translations): QueryResult {
  let optmization = translationOptimizations.get(translations)
  if (!optmization) {
    optmization = {
      cache: {},
      optimizedMap: optimizeTranslationForQueries(translations),
    }
    translationOptimizations.set(translations, optmization)
  }

  const { cache, optimizedMap } = optmization

  if (cache[key] != null) {
    return cache[key]
  }

  if (optimizedMap.literalKeys[key] != null) {
    cache[key] = {
      targetKey: key,
      translations,
      found: true,
      value: optimizedMap.literalKeys[key],
    }
    return cache[key]
  }

  const { templateKeys } = optimizedMap
  for (const { key: templateKey } of optimizedMap.templateKeysPriorityOrder) {
    if (templateKeys[templateKey].parsedKey.matches(key)) {
      cache[key] = {
        targetKey: key,
        translations,
        found: true,
        value: templateKeys[templateKey].value,
      }

      return cache[key]
    }
  }

  return {
    targetKey: key,
    translations,
    found: false,
    value: key,
  }
}
