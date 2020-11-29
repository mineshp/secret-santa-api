module.exports = {
  env: {
    es6: true,
    node: true,
    jasmine: true,
    browser: true,
  },
  extends: ['airbnb'],
  globals: {
    jest: true,
    document: true,
    browser: true,
    driver: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    'max-len': [
      'warn',
      {
        code: 120,
        ignoreStrings: true,
        ignoreRegExpLiterals: true,
      },
    ],
    'linebreak-style': ['error', 'unix'],
    'implicit-arrow-linebreak': 'off',
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'no-console': 'off',
    strict: 'warn',
    curly: 'error',
    'arrow-parens': ['error', 'always'],
    'function-paren-newline': 'off',
    'no-underscore-dangle': 'off',
    camelcase: 'error',
    'no-var': 'error',
    'comma-dangle': 'off',
    'class-methods-use-this': ['off'],
    'import/export': 'off',
    'import/prefer-default-export': 'off',
  },
  settings: {
    'import/resolver': {
      node: {
        moduleDirectory: ['node_modules'],
      },
    },
  },
};
