
interface Implementation {
    importLanguage(url: string, base: string): Promise<Record<string, string>>;
}

const defaultImplementation = Object.freeze({
    importLanguage: () => (console.error("importLanguage not implemented"), Promise.resolve({}))
} as Implementation)

export const implementation = Object.seal({
    ...defaultImplementation
})

export function provide(newImpl: Implementation){
    if(typeof newImpl?.importLanguage === "function"){
        implementation.importLanguage = newImpl.importLanguage
    }
}