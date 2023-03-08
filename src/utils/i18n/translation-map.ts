/**
 * Translation map
 *
 * `key` is language
 *
 * `value` is translation value
 */
type TranslationMap = Record<string, string>

/**
 * Translation search result
 *
 * `key` is the key being found
 *
 * `found` indicates if the key was found
 *
 * `translations` is the translation map, if not found it is empty
 */
interface TranslationFindResult {
  key: string
  found: boolean
  translations: TranslationMap
}

const translationNotFoundObj = Object.freeze({
  found: false,
  translations: Object.freeze({}),
})

/** returns a not found `TranslationFindResult` */
const translationNotFound = (key: string) =>
  Object.freeze(Object.create(translationNotFoundObj, {
    key: { value: key },
  })) as TranslationFindResult

/** find translataions for key, always returns `TranslationFindResult` even when not found */
export function findTranslations(key: string): TranslationFindResult {
  console.error('Not implemented yet, on failure mode: returning not found object')
  return translationNotFound(key)
}
