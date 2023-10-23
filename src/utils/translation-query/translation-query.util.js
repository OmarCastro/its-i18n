import { parseKey } from '../../key-parser/key-parser.util.js'
import { parseValue } from '../../key-parser/value-parser.util.js'

const initOptimizedTranslationsObject = () => /** @type {OptimizedTranslations} */ ({
  literalKeys: {},
  templateKeys: {},
  sortedTemplateKeys: [],
  prefixTemplateSearchByWords: {},
})

/**
 * Creates an {@link OptimizedTranslations} based on target {@link Translations}
 * @param {Translations} translations - target translations
 * @returns {OptimizedTranslations} resulting optimized translation
 */
function optimizeTranslationForQueries (translations) {
  const result = initOptimizedTranslationsObject()
  const { literalKeys, templateKeys, sortedTemplateKeys, prefixTemplateSearchByWords } = result

  for (const [key, value] of Object.entries(translations)) {
    const parsedKey = parseKey(key)
    if (parsedKey.priority[0] <= 0) {
      literalKeys[key] = value
      continue
    }

    const optimizedTemplateKey = { key, parsedKey, value }

    templateKeys[key] = optimizedTemplateKey
    sortedTemplateKeys.push(optimizedTemplateKey)
    const prefix = parsedKey.ast.tokens[0].text

    prefixTemplateSearchByWords[prefix] ||= {}
    prefixTemplateSearchByWords[prefix][key] = value
  }

  sortedTemplateKeys.sort((a, b) => b.parsedKey.priorityAsNumber - a.parsedKey.priorityAsNumber)

  return result
}

/** @type {WeakMap<Translations, TranslationQueryOptimization>} */
const translationOptimizations = new WeakMap()

/**
 * @param {Translations} translations - target translations
 * @returns {TranslationQueryOptimization} translation query optimization object
 */
function getOrInitOptimizations (translations) {
  let optmization = translationOptimizations.get(translations)
  if (!optmization) {
    optmization = {
      cache: {},
      optimizedMap: optimizeTranslationForQueries(translations),
    }
    translationOptimizations.set(translations, optmization)
  }
  return optmization
}

/**
 * @param {string} key - target key used in query
 * @param {Translations} translations - translation object used to query
 * @returns {QueryResult} built not found query result
 */
const notFoundQueryResult = (key, translations) => ({
  targetKey: key,
  translations,
  found: false,
  valueTemplate: '',
  translate: () => key,
})

/**
 *
 * @param {string} key - target key used in query
 * @param {Translations} translations - translation object used to query
 * @param {string} valueTemplate - found value template
 * @param {MatchResult} [matchResult] - match result data, optional
 * @returns {QueryResult} built found query result
 */
const foundQueryResult = (key, translations, valueTemplate, matchResult) => ({
  targetKey: key,
  translations,
  found: true,
  valueTemplate,
  translate: translatorFromValue(valueTemplate, matchResult),
})

/**
 * @param {string} key - target key
 * @param {OptimizedTranslations} optimizedMap - target optimized translation map
 * @returns {{templateKey: OptimizedTemplateKey, matchResult: MatchResult} | null} matching template key or null if not found
 */
function findMatchingTemplateKey (key, optimizedMap) {
  const { templateKeys } = optimizedMap
  for (const { key: templateKeyStr } of optimizedMap.sortedTemplateKeys) {
    const templateKey = templateKeys[templateKeyStr]
    const matchResult = templateKey.parsedKey.match(key)
    if (matchResult.isMatch) {
      return {
        templateKey,
        matchResult,
      }
    }
  }
  return null
}

/**
 * Queries translation value from a {@link Translations} object
 * @param {string}       key          - target key
 * @param {Translations} translations - target {@link Translations} object to search
 * @returns {QueryResult} result of the query
 */
export function queryFromTranslations (key, translations) {
  const { cache, optimizedMap } = getOrInitOptimizations(translations)

  if (cache[key] != null) { return cache[key] }

  if (optimizedMap.literalKeys[key] != null) {
    const valueTemplate = optimizedMap.literalKeys[key]
    cache[key] = foundQueryResult(key, translations, valueTemplate)
    return cache[key]
  }
  const matchingTemplateKey = findMatchingTemplateKey(key, optimizedMap)
  if (matchingTemplateKey) {
    const valueTemplate = matchingTemplateKey.templateKey.value
    cache[key] = foundQueryResult(key, translations, valueTemplate, matchingTemplateKey.matchResult)
    return cache[key]
  }

  return notFoundQueryResult(key, translations)
}

/**
 * Gets the tranlate function from value template and match result, in case match Result is undefined
 * it will assume it came from a literal key match
 * @param {string} valueTemplate target match result
 * @param {MatchResult} [match] target match result
 * @returns {TranslateFunction} translate function from targetMatch
 */
function translatorFromValue (valueTemplate, match) {
  const parameters = match?.parameters ?? []
  const defaultFormatters = match?.defaultFormatters ?? []
  let value
  return (locale) => {
    value ??= parseValue(valueTemplate)
    return value.format(parameters, locale, defaultFormatters)
  }
}

/**
 * @typedef {string} TranslationValue
 *
 * Translation value, it is a separate type since it is expected to change.
 *
 * The current plan is in the future to chang to {
 *    value: string,
 *    kind: "raw" | "template" | "import" | "import template"
 * }
 */

/**
 * @typedef {ReturnType<ReturnType<typeof parseKey>["match"]>} MatchResult
 */

/**
 * @typedef {{[key: string]: TranslationValue}} Translations
 *
 * Translation map
 */

/**
 * @typedef {object} TranslationQueryOptimization
 *
 * An object used to optimize queries from a {@link Translations} object, it is generated the fist time it is called
 * {@link queryFromTranslations} for each new {@link Translations} object
 * @property {{[key: string]: QueryResult}}  cache        - query result cache map used for memoization
 * @property {OptimizedTranslations}        optimizedMap - optimized translation map @see OptimizedTranslations
 */

/**
 * @typedef {object} QueryResult
 *
 * Result of queryFromTranslations
 * @property {string}             targetKey      - key used to search translation
 * @property {Translations}       translations   - translation map used for search
 * @property {boolean}            found          - boolean that tells whether the key was found
 * @property {string}             valueTemplate  - template of found value from query, emptry string if not found
 * @property {TranslateFunction}  translate      - translate function based on locale, returns target key if not found
 */

/**
 * @callback TranslateFunction
 * @param {Intl.Locale} locale - locale used to translate
 * @returns {string} translated content
 */

/**
 * @typedef {object} OptimizedTranslations
 *
 *   A {@link Translations} object adapted to improve query speed
 * @property {Translations}                          literalKeys                 -   It contains only non-template keys, since they have the highest
 *  priority it will be use for a quick search before searching the remaining keys, which all are template keys
 * @property {{[key: string]: OptimizedTemplateKey}} templateKeys   - A map of "template key" to "optimized template info" with already computed information
 * @property {OptimizedTemplateKey[]}           sortedTemplateKeys -  A list of of template keys sorted by priority
 * @property {{[prefix: string]: Translations}}    prefixTemplateSearchByWords - A map of translations by prefix, unused, @todo use it
 */

/**
 * @typedef {object} OptimizedTemplateKey
 *
 * An optimized template key entry with already parsed key as to avoid parsing it again every query
 * @property {string}                      key       - target translation key
 * @property {ReturnType<typeof parseKey>} parsedKey - parsed target translation key information for faster matches
 * @property {string}                      value     - respective value of Tranlation key
 */
