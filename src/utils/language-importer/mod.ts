import { implementation } from "./provider.js";

type ImportLanguage = typeof implementation.importLanguage
export const importLanguage: ImportLanguage = (url, base) => implementation.importLanguage(url, base)