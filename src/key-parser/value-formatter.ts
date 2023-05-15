import { type AST, states, type Token } from './key-ast.util.ts'
import { escape } from '../utils/algorithms/regex.utils.ts'
import { type CaptureExpressionInfo, captureExpressions } from './capture-expression-values.ts'
import { formatters as expressionFormatters } from './expression-formatters.ts'
import { isInteger } from '../utils/algorithms/number.utils.ts'

const emptyArray = Object.freeze([])

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

function parseCaptureKey(captureToken: Token) {
  const fragmentedCaptureExpressionsInfo = [] as CaptureExpressionsInfoDetail[]

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
        })
        currentExpression = ''
        continue
      case states.sq_string:
      case states.dq_string:
      case states.bt_string:
        fragmentedCaptureExpressionsInfo.push({
          type: 'string',
          text: token.text,
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
    })
  }

  return fragmentedCaptureExpressionsInfo
}

const applyDefaultformatter: FormatterReducer = (acc) =>
  acc.defaultFormatters && typeof acc.position === 'number'
    ? ({
      ...acc,
      result: acc.defaultFormatters[acc.position](acc.result, acc.locale),
    })
    : acc

function getFormatterFromTokens(tokens: Token[]) {
  const captureTokens = tokens.filter((token) => token.type === states.capture)

  if (captureTokens.length <= 0) {
    const textToMatch = tokens.map((token) => token.text).join('')
    return formatSimpleKey(textToMatch)
  }

  const strings = [] as string[]
  const formatters = [] as Formatter[]

  for (const keyToken of tokens) {
    if (keyToken.type !== states.capture) {
      strings.push(keyToken.text)
      continue
    }
    const fragmentedCaptureExpressionsInfo = parseCaptureKey(keyToken)

    if (fragmentedCaptureExpressionsInfo.length === 0) {
      formatters.push(() => '')
      continue
    }

    const fragmentedFormatters = [] as FormatterReducer[]

    const [firstInfo, ...restInfo] = fragmentedCaptureExpressionsInfo

    if (firstInfo.type === 'string') {
      const { text } = firstInfo
      fragmentedFormatters.push((acc) => ({ ...acc, result: text }))
    } else if (isInteger(firstInfo.text)) {
      const position = +firstInfo.text
      fragmentedFormatters.push((acc) => {
        const { parameters } = acc
        if (parameters.length <= position) {
          return {
            ...acc,
            result: '',
            exit: true,
          }
        }
        return {
          ...acc,
          position,
          result: parameters[position],
        }
      })
    } else {
      formatters.push(() => '')
      continue
    }

    for (const info of restInfo) {
      const { text } = info
      if (Object.hasOwn(expressionFormatters, text)) {
        const formatter = expressionFormatters[text]
        fragmentedFormatters.push((acc) => ({
          ...acc,
          result: formatter.format(acc.result, acc.locale),
        }))
      }
    }

    if (fragmentedFormatters.length <= 1) {
      fragmentedFormatters.push(applyDefaultformatter)
    }

    formatters.push((parameters: string[], locale: Intl.Locale, defaultFormatters?: DefaultFormatter[]) => {
      let reducerAcc: FormatterReducerAcc = {
        parameters,
        defaultFormatters,
        result: '',
        locale,
      }
      for (const fragmentedFormatter of fragmentedFormatters) {
        if (reducerAcc.exit) {
          return reducerAcc.result
        }
        reducerAcc = fragmentedFormatter(reducerAcc)
      }
      return reducerAcc.result
    })
  }
  return formatterWithFormat({ strings, formatters })
}

export function getFormatter(ast) {
  return getFormatterFromTokens(ast.tokens)
}

type CaptureExpressionsInfoDetail = {
  type: 'expression' | 'string'
  text: string
}

type ParameterMatchResult = Readonly<
  { isMatch: false } | {
    isMatch: true
    expressionInfo: CaptureExpressionInfo
  }
>

type FormatterReducerAcc = {
  parameters: string[]
  defaultFormatters?: DefaultFormatter[]
  result: string
  locale: Intl.Locale
  position?: number
  exit?: boolean
}
type FormatterReducer = (previous: FormatterReducerAcc) => FormatterReducerAcc

type DefaultFormatter = (text: string, locale: Intl.Locale) => string

type Formatter = (parameters: string[], locale: Intl.Locale, defaultFormatters?: DefaultFormatter[]) => string

type TemplateFormatter = {
  strings: readonly string[]
  formatters: readonly Formatter[]
  format: (parameters: readonly string[], locale: Intl.Locale, defaultFormatters?: readonly DefaultFormatter[]) => string
}
