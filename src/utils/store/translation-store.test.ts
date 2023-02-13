import { test } from '../../../test-utils/unit/test.ts';
import { i18nTanslationStore } from './translation-store.ts';

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

