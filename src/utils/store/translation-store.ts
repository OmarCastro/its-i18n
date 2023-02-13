import { importLanguage } from "../i18n-importer/mod.ts"

interface Translations {
    [key: string]: string
}

interface TranslationsDefinition {
    extends?: string | string[],
    translations: Translations
}


interface StoreData {
    languages: Record<string, TranslationsDefinition>
    location: string
}



type StoreInfo = {
    data: StoreData
    computedTranslationsFromLanguage: Record<string, Translations>
}

type StorePrototype = {
    loadTranslations(this: Store, data: StoreData): void
    translationsFromLanguage(this: Store, locale: string | Intl.Locale): Promise<Translations>

}

type Store = StorePrototype & StoreInfo


const emptyObj = Object.freeze({})
const intialDataStore = Object.freeze({
    languages: emptyObj,
    location: ""
}) as StoreData

/////////////
// Getters //
/////////////

function translationsDefaultContext(store: StoreData){
    const {extends: ext, translationsFromExtends, translations} = store.languages
    if(ext != null && translationsFromExtends == null){
        throw Error("translationsFromExtends shuld have been already loaded before running this method")
    }
    return {
        ...translationsFromExtends,
        ...translations
    }

}

/////////////
// Setters //
/////////////

function setStore(acc: StoreData, storeData: StoreData){

}

const isLocale = (locale: string) => {
    try {
        new Intl.Locale(locale)
        return true
    } catch {
        return false
    }
}

function normalizeTranslationData(data: StoreData) {
    const originalLangs = data.languages
    const languages = {} as typeof originalLangs
    const result: StoreData = {
        location: data.location,
        languages
    }
    
    for(const localeString of Object.keys(data.languages) ){
        let locale: Intl.Locale;
        try {
            locale = new Intl.Locale(localeString)
        } catch {
            console.error(`Error: Invalid locale ${localeString}, it will not be added to the I18n store`)
            continue
        }
        const {baseName} = locale
        if(baseName !== localeString){
            if(originalLangs[baseName]){
                console.error(`Error: Invalid locale "${localeString}", it also conflicts with correct locale "${baseName}", it will not be added to the I18n store`)
                continue
            } else {
                console.warn(`Warn: Invalid locale "${localeString}", fixed to locale "${baseName}"`)
            }
        }
        languages[baseName] = structuredClone(originalLangs[localeString])
    }
    return result;
}

const getTranslationsFromData = async (store: StoreInfo, locale: string) : Promise<Translations> => {
    const computed = store.computedTranslationsFromLanguage
    if(computed[locale]){
        return computed[locale]
    }
    const definition = store.data.languages[locale]
    if(!definition){ return {} }
    if(!definition.extends){
        return definition.translations
    }
    const extendsArray = [].concat(definition.extends as any) as string[]
    const translationsFromExtends = {}
    for(const extend of extendsArray){
        const translations = isLocale(extend) ? 
            await getTranslationsFromData(store, extend) :
            await importLanguage(extend, store.data.location)
        Object.assign(translationsFromExtends, translations)
    }

    computed[locale] = {
        ...translationsFromExtends,
        ...definition.translations
    }
    return computed[locale];
}

const StorePrototype = {
    loadTranslations(data){
        this.data = normalizeTranslationData(data)
        this.computedTranslationsFromLanguage = {}
    },

    async translationsFromLanguage(locale): Promise<Translations>{
        if(typeof locale == "string"){
            return await this.translationsFromLanguage(new Intl.Locale(locale))
        }
        if(this.computedTranslationsFromLanguage[locale.baseName]){
            return this.computedTranslationsFromLanguage[locale.baseName]
        }
        const languages = [locale.baseName]
        const intlLang = locale.language
        if(locale.region != null){
            const langRegion = `${intlLang}-${locale.region}`
            if(!languages.includes(langRegion)){
                languages.push(langRegion)
            }
        }
        if(!languages.includes(intlLang)){
            languages.push(intlLang)
        }
        const result = {}
        for(const language of languages.reverse()){
            const translations = await getTranslationsFromData(this, language)
            Object.assign(result, translations)
        }
        this.computedTranslationsFromLanguage[locale.baseName] = result
        return result

    }
} as StorePrototype
 

export function i18nTanslationStore(): Store{
    return Object.assign(Object.create(StorePrototype), {
        data: intialDataStore,
        computedTranslationsDefaultContext: {},
        computedTranslationsByContextData: {}
    })
}