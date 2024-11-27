import globals from 'globals'
import js from '@eslint/js'
import neostandard from 'neostandard'
import sonarjs from 'eslint-plugin-sonarjs'
import jsdoc from 'eslint-plugin-jsdoc'
// eslint-disable-next-line
import cspellESLintPluginRecommended from '@cspell/eslint-plugin/recommended'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import eslintPluginImportX from 'eslint-plugin-import-x'

export default [
  {
    ignores: [
      '**/*.min.js',
      '**/build',
      '**/node_modules',
      '**/dist',
    ],
  },
  ...neostandard(),
  js.configs.recommended,
  jsdoc.configs['flat/recommended-typescript-flavor'],
  sonarjs.configs.recommended,
  eslintPluginImportX.flatConfigs.recommended,
  cspellESLintPluginRecommended,
  {
    plugins: {
      unicorn: eslintPluginUnicorn,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'unicorn/prefer-code-point': ['warn'],
      'unicorn/prefer-string-slice': ['warn'],
      'unicorn/prefer-at': ['warn'],
      'unicorn/prefer-modern-dom-apis': ['warn'],
      'unicorn/no-array-push-push': ['warn'],
      'unicorn/prefer-node-protocol': ['error'],
      'unicorn/prefer-array-find': ['error'],
      'sonarjs/cognitive-complexity': ['error', 10],
      'max-lines-per-function': ['warn', 75],
      '@cspell/spellchecker': 0
    },
  },
  {
    files: ['src/**/*.js'],
    rules: {
      '@cspell/spellchecker': ['warn', { cspell: { words: ['untick', 'millis', 'sonarjs', 'quotemeta'] } }]
    }
  },
  {
    files: ['smoke-test/**/*.js'],
    rules: {
      'import-x/no-unresolved': 0
    }
  }, {
    files: [
      '**/*.spec.js',
      '**/*.spec.ts',
    ],
    rules: {
      'jsdoc/require-param-description': 0,
      'jsdoc/require-returns': 0,
      'jsdoc/require-returns-description': 0,
      '@cspell/spellchecker': 0,
      'max-lines-per-function': 0,
      'sonarjs/no-duplicate-string': 0,
      'sonarjs/no-identical-functions': 0
    }
  },

]
