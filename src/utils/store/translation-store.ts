
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
    loadTranslations(this: Store, data: StoreData)
    translationsFromLanguage(this: Store, locale: string | Intl.Locale)

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

function isTranslationMap(json): json is Translations {
    if(typeof json !== "object" || Array.isArray(json)){
        return false
    }
    return Object.keys(json).every(key => typeof[json[key]] === "string")
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
        if(isLocale(extend)){
            const translations = await getTranslationsFromData(store, extend)
            Object.assign(translationsFromExtends, translations)
            continue
        } 

        const url = new URL(extend, store.data.location)
        const response = await fetch(url)
        const json = await response.json()
        if(!isTranslationMap(json)){
            console.error("expected json from url %o to be a map of translations, ignoring data", url)
            continue
        } 
        Object.assign(translationsFromExtends, json)
    }

    computed[locale] = {
        ...translationsFromExtends,
        ...definition.translations
    }
    return computed[locale];
}

const StorePrototype = {
    loadTranslations(data){
        this.data = structuredClone(data)
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