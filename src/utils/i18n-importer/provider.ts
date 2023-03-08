export interface Translations {
  [key: string]: string
}

export interface I18nDefinition {
  extends?: string | string[]
  translations: Translations
}

export interface I18nDefinitionMap {
  [key: string]: I18nDefinition
}

export interface Implementation {
  importLanguage(url: string, base: string): Promise<Translations>
  importI18nJson(url: string, base: string): Promise<I18nDefinitionMap>
}

const defaultImplementation = Object.freeze({
  importLanguage: () => (console.error('importLanguage not implemented'), Promise.resolve({})),
  importI18nJson: () => (console.error('importLanguage not implemented'), Promise.resolve({})),
} as Implementation)

export const implementation = Object.seal({
  ...defaultImplementation,
})

export function provide(newImpl: Implementation) {
  if (typeof newImpl?.importLanguage === 'function') {
    implementation.importLanguage = newImpl.importLanguage
  }
  if (typeof newImpl?.importI18nJson === 'function') {
    implementation.importI18nJson = newImpl.importI18nJson
  }
}
