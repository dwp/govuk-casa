module.exports = {
  root: true,
  extends: ['@dwp/eslint-config-base', 'plugin:sonarjs/recommended'],
  plugins: [
    'no-unsafe-regex',
    'sonarjs',
  ],
  rules: {
    indent: [2, 2],
    semi: [0],
    'sonarjs/cognitive-complexity': [1, 10],
    'jsdoc/require-description-complete-sentence': [0],
    'no-unsafe-regex/no-unsafe-regex': 2,
    // Disabling rules added since @dwp/eslint-config-base@6.0.0
    'import/extensions': [0],
    'default-param-last': [0],
  },
  globals: {
    GOVUK_CASA_DEBUG_NS: true,
  },
  parserOptions: {
    ecmaVersion: '2020',
  },
};
