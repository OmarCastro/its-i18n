import { implementation } from './provider.ts'

type ImportLanguage = typeof implementation.importLanguage
export const importLanguage: ImportLanguage = (url, base) => implementation.importLanguage(url, base)

type importI18n = typeof implementation.importI18nJson
export const importI18nJson: importI18n = (url, base) => implementation.importI18nJson(url, base)
