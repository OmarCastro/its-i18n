import globals from 'globals'
import neostandard from 'neostandard'
import sonarjs from 'eslint-plugin-sonarjs'
import jsdoc from 'eslint-plugin-jsdoc'
import cspellESLintPluginRecommended from '@cspell/eslint-plugin/recommended'

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
  jsdoc.configs['flat/recommended-typescript-flavor'],
  sonarjs.configs.recommended,
  cspellESLintPluginRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'sonarjs/cognitive-complexity': ['error', 10],
      'max-lines-per-function': ['warn', 75],
      '@cspell/spellchecker': ['warn', { cspell: { words: ['untick', 'millis'] } }]
    },
  },
  {
    ignores: ['src'],
    rules: {
      '@cspell/spellchecker': 0
    }

  }
]
