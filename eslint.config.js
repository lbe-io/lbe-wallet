import globals from 'globals';
import pluginJs from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';
import { fixupConfigRules } from '@eslint/compat';
import prettierConfig from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['node_modules/*', '.output/*', '.wxt/*'],
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      prettier: pluginPrettier,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tsEslint.configs.recommended.rules,
      ...fixupConfigRules(pluginReactConfig).rules,
      ...prettierConfig.rules,
      'prettier/prettier': [
        'error',
        {
          tabWidth: 2,
          useTabs: false,
        },
      ],
      'max-len': ['error', { code: 2400 }],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'eslint-next-line': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/utils',
              message: "Deprecated compatibility layer. Import from '@/app/*', '@/shared/*', or '@/cosmos/*'.",
            },
            {
              name: '@/core/inject',
              message: "Deprecated compatibility layer. Import from '@/cosmos/provider' or '@/cosmos/provider/inpage'.",
            },
            {
              name: '@/data/db',
              message: "Moved to Cosmos domain. Import from '@/cosmos/storage'.",
            },
            {
              name: '@/wallet',
              message: "Moved to Cosmos domain. Import from '@/cosmos/wallet'.",
            },
          ],
          patterns: [
            {
              group: ['@/utils/*'],
              message: "Deprecated compatibility layer. Import from canonical module paths under '@/app', '@/shared', or '@/cosmos'.",
            },
            {
              group: ['@/core/inject/*'],
              message: "Deprecated compatibility layer. Import from '@/cosmos/provider/*'.",
            },
            {
              group: ['@/data/*'],
              message: "Moved to Cosmos domain. Import from '@/cosmos/storage/*'.",
            },
            {
              group: ['@/wallet/*'],
              message: "Moved to Cosmos domain. Import from '@/cosmos/wallet/*'.",
            },
          ],
        },
      ],
    },
  },
];
