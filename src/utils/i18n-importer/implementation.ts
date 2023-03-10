import type { Translations, I18nDefinitionMap } from "./provider.js";
import { provide } from "./provider.js";


function isTranslationMap(json): json is Translations {
    if(typeof json !== "object" || Array.isArray(json)){
        return false
    }
    return Object.keys(json).every(key => typeof[json[key]] === "string")
}

function isi18nDefinition(json): json is I18nDefinitionMap {
    if(typeof json !== "object" || Array.isArray(json)){
        return false
    }
    return Object.keys(json).every(key => typeof[json[key]] === "string")
}

provide({
    async importLanguage(reqUrl, base) {
        const url = new URL(reqUrl, base)
        const response = await fetch(url)
        const json = await response.json()
        if(!isTranslationMap(json)){
            console.error("expected json from url %o to be a map of translations, returning empty translation", url)
            return {}
        } 
        return json
    },
    async importI18nJson(reqUrl, base) {
        const url = new URL(reqUrl, base)
        const response = await fetch(url)
        const json = await response.json()
        if(!isi18nDefinition(json)){
            console.error("expected json from url %o to be a map of translations, returning empty translation", url)
            return {}
        } 
        return json
    }
})