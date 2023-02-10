

/**
 * Translation context, in most cases language is enough
 * but sometimes in case the translation is requested from
 * a webcomponent, in that case there is the `element` property
 */
interface Context {
    language?: Intl.Locale
    element?: HTMLElement
}


/**
 * 
 * Translates key into value, in case of failure returns the current key
 * 
 * @param key - translation key
 * @param context - context where the trasnlation is being run
 * @returns the translated key 
 */
export function translate(key:string, context?: Context): string {
    console.error("Not implemented yet, on failure mode: returning the current key")
    return key
}