import { type AST, states, type Token } from './key-ast.util.ts'
import { escape } from '../utils/algorithms/regex.utils.ts'
import { type CaptureExpressionInfo, captureExpressions } from './capture-expression-values.ts'
import { formatters } from './expression-formatters.ts'

const falsePredicate = () => false
const emptyArray = Object.freeze([])

const anyMatchExpression = Object.freeze({
  isMatch: true,
  expressionInfo: captureExpressions.special.any,
}) as ParameterMatchResult

const noMatchExpression = Object.freeze({
  isMatch: false,
})

const anyMatchCaptureExpressionsInfo = {
  matchPredicate: () => anyMatchExpression,
}

const formatterWithFormat = (templateFormatter: Omit<TemplateFormatter, 'format'>) =>
  ({
    ...templateFormatter,
    format: (parameters: string[], locale: Intl.Locale, defaultFormatters?: DefaultFormatter[]) => {
      const { strings, formatters } = templateFormatter
      let result = strings[0]
      for (let i = 1, e = strings.length; i < e; ++i) {
        result += formatters[i - 1](parameters, locale, defaultFormatters) + strings[i]
      }
      return result
    },
  }) as TemplateFormatter

const formatSimpleKey = (textToMatch: string) =>
  ({
    strings: [textToMatch],
    formatters: emptyArray,
    format: () => textToMatch,
  }) as TemplateFormatter

function getFormatterFromTokens(tokens: Token[]) {
  const captureTokens = tokens.filter((token) => token.type === states.capture)

  if (captureTokens.length <= 0) {
    const textToMatch = tokens.map((token) => token.text).join('')
    return formatSimpleKey(textToMatch)
  }

  const templateFormatter: TemplateFormatter = formatterWithFormat({
    strings: [],
    formatters: [],
  })

  const captureExpressionsInfo = captureTokens.map((captureToken) => {
    const fragmentedCaptureExpressionsInfo = [] as CaptureExpressionsInfoDetail[]
    if (captureToken.childTokens.length === 0) {
      return anyMatchCaptureExpressionsInfo
    }
    let currentExpression = ''
    for (const token of captureToken.childTokens) {
      switch (token.type) {
        case states.capture_expr:
          currentExpression = currentExpression ? `${currentExpression} ${token.text}` : token.text
          continue

        case states.capture_expr_sep:
          fragmentedCaptureExpressionsInfo.push({
            type: 'expression',
            text: currentExpression,
            expressionInfo: captureExpressions.named[currentExpression],
            matches: captureExpressions.named[currentExpression]?.matchPredicate() ?? falsePredicate,
          })
          currentExpression = ''
          continue
        case states.sq_string:
        case states.dq_string:
        case states.bt_string:
          fragmentedCaptureExpressionsInfo.push({
            type: 'string',
            text: token.text,
            expressionInfo: captureExpressions.special.string,
            matches: captureExpressions.special.string.matchPredicate(token.text),
          })
          continue
        default:
          console.error('error: invalid expression, ignoring...')
      }
    }
    if (currentExpression) {
      fragmentedCaptureExpressionsInfo.push({
        type: 'expression',
        text: currentExpression,
        expressionInfo: captureExpressions.named[currentExpression],
        matches: captureExpressions.named[currentExpression]?.matchPredicate() ?? falsePredicate,
      })
    }

    return {
      formatExpression: (parameters: string[], locale: Intl.Locale, defaultFormatters?: DefaultFormatter[]): string => {
        const expressionPart = fragmentedCaptureExpressionsInfo.find((expressionPart) => expressionPart.matches('text'))
        if (!expressionPart) {
          return 'noMatchExpression'
        }
        return ''
      },
    }
  })

  return templateFormatter
}

export function getFormatter(ast) {
  return getFormatterFromTokens(ast.tokens)
}

type CaptureExpressionsInfoDetail = {
  type: 'expression' | 'regex' | 'string' | 'any'
  text: string
  expressionInfo: CaptureExpressionInfo
  matches(text: string): boolean
}

type ParameterMatchResult = Readonly<
  { isMatch: false } | {
    isMatch: true
    expressionInfo: CaptureExpressionInfo
  }
>

type DefaultFormatter = (text: string, locale: Intl.Locale) => string

type Formatter = (parameters: string[], locale: Intl.Locale, defaultFormatters?: DefaultFormatter[]) => string

type TemplateFormatter = {
  strings: readonly string[]
  formatters: readonly Formatter[]
  format: (parameters: string[], locale: Intl.Locale, defaultFormatters?: DefaultFormatter[]) => string
}
