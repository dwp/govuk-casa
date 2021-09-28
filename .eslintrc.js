module.exports = {
  root: true,
  extends: ['@dwp/eslint-config-base', 'plugin:sonarjs/recommended'],
  plugins: [
    'sonarjs',
  ],
  rules: {
    indent: [2, 2],
    semi: [0],
    'sonarjs/cognitive-complexity': [1, 10],

    // Maintenance update to eslint introdues these
    'jsdoc/require-throws': 0,
    'jsdoc/require-description-complete-sentence': 0,
    'jsdoc/check-tag-names': 0,
    'jsdoc/require-returns': 0,
    'jsdoc/require-param': 0,
    'jsdoc/require-description': 0,
  },
  globals: {
    GOVUK_CASA_DEBUG_NS: true,
  },
  parserOptions: {
    ecmaVersion: '2018',
  },
};
