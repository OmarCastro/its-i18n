import { test } from '../../test-utils/unit/test.js'
import { getAST } from './key-ast.util.ts'
import { getFormatter } from './value-formatter.ts'
import { captureExpressions } from './capture-expression-values.ts'

test('Given a simple string, getFormatter result should format the same string', ({ expect }) => {
  const ast = getAST('hello world')
  const formatter = getFormatter(ast)
  const locale = new Intl.Locale('en-GB')
  const result = formatter.format([], locale)
  expect(formatter.format([], locale)).toEqual('hello world')
})

test('Given a number formatter, getFormatter result should format the number with the correct separator', ({ expect }) => {
  const ast = getAST('1 meter is {0 | number} kilometers')
  const formatter = getFormatter(ast)
  const gbLocale = new Intl.Locale('en-GB')
  const frLocale = new Intl.Locale('fr-FR')
  expect(formatter.format(['0.001'], gbLocale)).toEqual('1 meter is 0.001 kilometers')
  expect(formatter.format(['0.001'], frLocale)).toEqual('1 meter is 0,001 kilometers')
})

test('Given a default number formatter, getFormatter result should format the number with the correct separator', ({ expect }) => {
  const ast = getAST('1 meter is {0} kilometers')
  const formatter = getFormatter(ast)
  const defaultFormatters = [captureExpressions.named.number.defaultFormat]
  const gbLocale = new Intl.Locale('en-GB')
  const frLocale = new Intl.Locale('fr-FR')
  expect(formatter.format(['0.001'], gbLocale, defaultFormatters)).toEqual('1 meter is 0.001 kilometers')
  expect(formatter.format(['0.001'], frLocale, defaultFormatters)).toEqual('1 meter is 0,001 kilometers')
})

test('Given a default unix timestamp formatter, getFormatter result should format the number with the correct separator', ({ expect }) => {
  const ast = getAST('1 million seconds since unix is in {0}')
  const formatter = getFormatter(ast)
  const defaultFormatters = [captureExpressions.named['unix timestamp'].defaultFormat]
  const usLocale = new Intl.Locale('en-US')
  const gbLocale = new Intl.Locale('en-GB')
  const frLocale = new Intl.Locale('fr-FR')
  const jpLocale = new Intl.Locale('ja-JP')

  expect({
    'en-US': formatter.format(['1000000'], usLocale, defaultFormatters),
    'en-GB': formatter.format(['1000000'], gbLocale, defaultFormatters),
    'fr-FR': formatter.format(['1000000'], frLocale, defaultFormatters),
    'ja-JP': formatter.format(['1000000'], jpLocale, defaultFormatters),
  }).toEqual({
    'en-US': '1 million seconds since unix is in 1/12/1970, 13:46:40.000',
    'en-GB': '1 million seconds since unix is in 12/01/1970, 13:46:40.000',
    'fr-FR': '1 million seconds since unix is in 12/01/1970 13:46:40,000',
    'ja-JP': '1 million seconds since unix is in 1970/1/12 13:46:40.000',
  })
})

test('Given a relative formatter, getFormatter result should format the number with the correct separator', ({ expect }) => {
  const ast = getAST('unix epoch started {\'0\' | relative time}')
  const formatter = getFormatter(ast)
  const usLocale = new Intl.Locale('en-US')
  const gbLocale = new Intl.Locale('en-GB')
  const frLocale = new Intl.Locale('fr-FR')
  const jpLocale = new Intl.Locale('ja-JP')

  expect({
    'en-US': formatter.format([], usLocale, []),
    'en-GB': formatter.format([], gbLocale, []),
    'fr-FR': formatter.format([], frLocale, []),
    'ja-JP': formatter.format([], jpLocale, []),
  }).toEqual({
    'en-US': 'unix epoch started 54 years ago',
    'en-GB': 'unix epoch started 54 years ago',
    'fr-FR': 'unix epoch started il y a 54 ans',
    'ja-JP': 'unix epoch started 54 年前',
  })
})
