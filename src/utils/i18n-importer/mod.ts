import { implementation } from './provider.ts'
export type { I18nDefinition, I18nDefinitionMap } from './provider.ts'

type ImportTranslations = typeof implementation.importTranslations
export const importTranslations: ImportTranslations = (url, base) => implementation.importTranslations(url, base)

type importI18n = typeof implementation.importI18nJson
export const importI18nJson: importI18n = (url, base) => implementation.importI18nJson(url, base)
