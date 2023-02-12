import { provide } from "./provider.js";


interface Translations {
    [key: string]: string
}

function isTranslationMap(json): json is Translations {
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
})