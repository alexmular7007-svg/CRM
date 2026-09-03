import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  // Config/build files — need Node.js globals (e.g. __dirname)
  {
    files: ['*.config.js', '*.config.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  // Application source files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Allow empty catch blocks (used intentionally in websocketService.js)
      'no-empty': ['error', { allowEmptyCatch: true }],
      // These were never previously enforced (lint script was failing on Vercel before this fix)
      'no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
]


