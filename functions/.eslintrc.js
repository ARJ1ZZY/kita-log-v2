module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'google',
  ],
  rules: {
    'quotes': ['error', 'single'],
    'object-curly-spacing': ['error', 'always'],
    'max-len': ['error', { 'code': 120 }],
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'linebreak-style': 'off',
    'indent': 'off',
    'eol-last': 'off',
    'require-jsdoc': 'off',
    'arrow-parens': 'off',
    'quote-props': 'off',
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
};