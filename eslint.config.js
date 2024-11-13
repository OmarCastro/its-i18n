import globals from 'globals'
import js from '@eslint/js'
import neostandard from 'neostandard'
import sonarjs from 'eslint-plugin-sonarjs'
import jsdoc from 'eslint-plugin-jsdoc'
import cspellESLintPluginRecommended from '@cspell/eslint-plugin/recommended'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'

export default [
  {
    ignores: [
      '**/*.spec.js',
      '**/*.spec.ts',
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

  }
]
