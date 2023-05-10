const formatAsIs = (text: string) => text

const baseFormatter = {
  'as is': {
    format: formatAsIs,
  },

  'number': {
    format: (text: string, locale: Intl.Locale) => Intl.NumberFormat(locale.baseName).format(Number(text)),
  },

  'long date': {
    format: (text: string, locale: Intl.Locale) => Intl.NumberFormat(locale.baseName).format(Number(text)),
  },
} as FormatternMap

type FormatternMap = {
  [expression: string]: Formatter
}

export type Formatter = {
  format: (text: string, locale: Intl.Locale) => string
}

export const formatters = baseFormatter
