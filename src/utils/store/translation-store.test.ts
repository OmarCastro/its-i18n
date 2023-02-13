import { test } from '../../../test-utils/unit/test.ts';
import { i18nTanslationStore } from './translation-store.ts';


test("Given a new store, when loadTranslations ", async ({step: originalStep, expect}) => {

    const store = i18nTanslationStore()

    const translations = {
        "untranslated text": "untranslated text"
    }

    const storeDataWithLangs = (languages: any) => ({location: "", languages})    

    const consoleCalls = { error: [] as any[], warn: [] as any[] }
    const originalConsoleWarn = console.warn
    const originalConsoleError = console.error
    console.warn = (...args) => {
        consoleCalls.warn.push(args)
    }

    console.error = (...args: any[]) => {
        consoleCalls.error.push(args)
    } 

    const step = async (...args: Parameters<typeof originalStep>) => {
        consoleCalls.error.length = 0
        consoleCalls.warn.length = 0
        return await originalStep.apply(null, args)
    }

    await step('with "en", "pt" & "es", should load wihout problems', async () => {
        const store = i18nTanslationStore()
        store.loadTranslations(storeDataWithLangs({
            en: {translations},
            pt: {translations},
            es: {translations},
        }))
        expect(consoleCalls).toEqual({ error: [], warn: [] })
        expect(Object.keys(store.data.languages)).toEqual(["en", "pt", "es"])
    })
    await step('with "en" & "en-US", should load wihout problems', async () => {
        const store = i18nTanslationStore()
        store.loadTranslations(storeDataWithLangs({
            en: {translations},
            "en-US": {translations},
        }))
        expect(consoleCalls).toEqual({ error: [], warn: [] })
        expect(Object.keys(store.data.languages)).toEqual(["en", "en-US"])

    })
    await step('with "en" & "en-UK", should warn about invalid and fixed locale', async () => {
        const store = i18nTanslationStore()
        store.loadTranslations(storeDataWithLangs({
            en: {translations},
            "en-UK": {translations},
        }))
        expect(consoleCalls).toEqual({ error: [], warn: [
            [ 'Warn: Invalid locale "en-UK", fixed to locale "en-GB"' ]
        ] })
        expect(Object.keys(store.data.languages)).toEqual(["en", "en-GB"])

    })

    await step('with "en", "en-UK" & "en-GB", should log error of invalid & conflicting locale and should be discarded', async () => {
        const store = i18nTanslationStore()
        store.loadTranslations(storeDataWithLangs({
            en: {translations},
            "en-UK": {translations},
            "en-GB": {translations},
        }))
        expect(consoleCalls).toEqual({ error: [
            ['Error: Invalid locale "en-UK", it also conflicts with correct locale "en-GB", it will not be added to the I18n store']
        ], warn: [] })
        expect(Object.keys(store.data.languages)).toEqual(["en", "en-GB"])

    })
    
    console.warn = originalConsoleWarn
    console.error = originalConsoleError
    
})



test("Given a completed storeData, when getting translationsFromLanguage ", async ({step, expect}) => {

    const store = i18nTanslationStore()
    const storeData = {
        location: "",
        languages: {
            en: {
                translations: {
                    "hello world": "hello world"
                }
            },
            pt: {
                translations: {
                    "hello world": "olá mundo"
                }
            },
            es: {
                translations: {
                    "hello world": "hola mundo"
                }
            },
        }
    }
    store.loadTranslations(storeData)
    const englishTranslations = storeData.languages.en.translations

    await step('"en", should return english translations', async () => {
        expect(await store.translationsFromLanguage("en")).toEqual(englishTranslations)
    })
    await step('"en-US", should still return english translations', async () => {
        expect(await store.translationsFromLanguage("en-US")).toEqual(englishTranslations)
    })
    await step('"en-Latn-US", should still return english translations', async () => {
        expect(await store.translationsFromLanguage("en-Latn-US")).toEqual(englishTranslations)
    })
    
    
})


test("Given a completed storeData, when getting translationsFromLanguage ", async ({step, expect}) => {

    const store = i18nTanslationStore()
    const storeData = {
        location: "",
        languages: {
            en: {
                translations: {
                    "hello world": "hello world",
                    "I like red color": "I like red color",
                    "I will go in a bus": "I will go in a bus",
                }
            },
            "en-GB": {
                translations: {
                    "I like red color": "I like red colour",
                }
            },
            pt: {
                translations: {
                    "hello world": "olá mundo",
                    "I like red color": "Gosto da cor vermelha",
                    "I will go in a bus": "Irei de autocarro",
                }
            },
            "pt-BR": {
                translations: {
                    "I will go in a bus": "Eu vou de ônibus",
                }
            },
            es: {
                translations: {
                    "hello world": "hola mundo",
                    "I like red color": "Me gusta la color roja",
                    "I will go in a bus": "Iré en un autobús",
                }
            },
        }
    }
    store.loadTranslations(storeData)
    const englishTranslations = storeData.languages.en.translations

    await step('"en", should return english translations', async () => {
        expect(await store.translationsFromLanguage("en")).toEqual(englishTranslations)
    })
    await step('"en-US", should still return english translations', async () => {
        expect(await store.translationsFromLanguage("en-US")).toEqual(englishTranslations)
    })
    await step('"en-GB", should return english translations with GB customization', async () => {
        expect(await store.translationsFromLanguage("en-UK")).toEqual({
            ...englishTranslations,
            "I like red color": "I like red colour",
        })
    })
    await step('"en-Latn-GB", should still return english translations with GB customization', async () => {
        expect(await store.translationsFromLanguage("en-Latn-GB")).toEqual({
            ...englishTranslations,
            "I like red color": "I like red colour",
        })
    })
    
    
})


