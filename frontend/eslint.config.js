import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Async data-fetching inside useEffect is the standard React pattern.
      // The rule incorrectly flags `useEffect(() => { void fetchData() }, [deps])`
      // as "calling setState inside an effect" — safe to disable project-wide.
      'react-hooks/set-state-in-effect': 'off',

      // Warn instead of error for missing exhaustive deps — too many false
      // positives with useCallback + useRef patterns used throughout.
      'react-hooks/exhaustive-deps': 'warn',

      // Allow intentional unused vars prefixed with _ (e.g. _unused)
      '@typescript-eslint/no-unused-vars': ['error', {
        vars: 'all',
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
])
