
interface Translations {
    [key: string]: string
}

interface TranslationsDefinition {
    extends?: string | string[],
    translationsFromExtends?: Translations | Translations[]
    translations: Translations
}


interface StoreData {
    languages: TranslationsDefinition
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