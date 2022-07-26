module.exports = {
  env: {
    node: true,
    browser: true,
    es6: true,
    jest: true,
  },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    indent: 'off',
    'import/no-unresolved': [
      2,
      {
        ignore: ['^Models$', '^Utils', '^Helpers', '^Functions', '^Schemas'],
      },
    ],
    'import/prefer-default-export': 'off',
    'max-len': [
      'warn',
      {
        code: 140,
        ignoreComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
    'no-await-in-loop': 'warn',
    'no-restricted-syntax': 'off',
    'no-param-reassign': 'off',
    'no-unused-vars': [
      'error',
      {
        args: 'none',
      },
    ],
    'prefer-const': [
      'error',
      {
        destructuring: 'all',
      },
    ],
  },
};
