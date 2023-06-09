//@ts-check
import { parseKey } from '../../key-parser/key-parser.util.ts'
import { parseValue } from '../../key-parser/value-parser.util.ts'

/**
 * @param {Translations} translations
 * @returns {OptimizedTranslations}
 */
function optimizeTranslationForQueries(translations) {
  /** @type OptimizedTranslations */
  const result = {
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

/** @type TranslationOptimizations */
const translationOptimizations = new WeakMap()

/**
 * @param {string} key
 * @param {Translations} translations
 * @returns {QueryResult}
 */
export function queryFromTranslations(key, translations) {
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
    const valueTemplate = optimizedMap.literalKeys[key]
    cache[key] = {
      targetKey: key,
      translations,
      found: true,
      valueTemplate,
      translate: () => valueTemplate,
    }
    return cache[key]
  }

  const { templateKeys } = optimizedMap
  for (const { key: templateKey } of optimizedMap.templateKeysPriorityOrder) {
    const { parsedKey } = templateKeys[templateKey]
    const match = parsedKey.match(key)

    if (match.isMatch) {
      const valueTemplate = templateKeys[templateKey].value

      let translate = (locale) => {
        const value = parseValue(valueTemplate)
        translate = (locale) => value.format(match.parameters, locale, match.defaultFormatters)
        return translate(locale)
      }

      cache[key] = {
        targetKey: key,
        translations,
        found: true,
        valueTemplate,
        translate,
      }

      return cache[key]
    }
  }

  return {
    targetKey: key,
    translations,
    found: false,
    valueTemplate: '',
    translate: () => key,
  }
}

/**
 * @typedef {string} TranslationValue
 */

/**
 * @typedef {{[k: string]: TranslationValue}} Translations
 */

/**
 * @typedef {WeakMap<Translations, { cache: QueryResultCache; optimizedMap: OptimizedTranslations }>} TranslationOptimizations
 */

/**
 * @typedef {object} QueryResult
 *
 * Result of queryFromTranslations
 *
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
 * @typedef {{[k: string]: QueryResult}} QueryResultCache
 */

/**
 * @typedef {object} OptimizedTranslations
 *
 *   A `Translations` object adapted to improve query speed, it is generated the fist time it is called
 * `queryFromTranslations` for every new `Translation`
 *
 * @property {Translations}                          literalKeys
 *    It contains only non template keys, since they have the highest priority it will be use for a quick search before
 *  searching the remaining keys, which all are template keys
 *
 * @property {Object<string, OptimizedTemplateKeys>} templateKeys
 *  A map of "template key" to "optimized template info" with already computed information
 *
 * @property {TemplateKeysPriorityOrder[]}           templateKeysPriorityOrder
 *  A list of of template keys sorted by priority
 *
 * @property {Object<string, Translations>}          prefixTemplateSearchByWords
 *   A map of translations by prefix, unused, @todo use it
 */

/**
 * @typedef {object} OptimizedTemplateKeys
 * @property {ReturnType<typeof parseKey>} parsedKey - parsed key information for faster matches
 * @property {string}                      value     - respective value of Tranlation key
 */

/**
 * @typedef {object} TemplateKeysPriorityOrder
 * @property {string} key      - translation key
 * @property {number} priority - translation priority
 */
