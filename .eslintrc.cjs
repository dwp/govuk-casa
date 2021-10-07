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
    'jsdoc/require-description-complete-sentence': 0,
    'no-unsafe-regex/no-unsafe-regex': 2,
    'import/extensions': 0,
    'no-underscore-dangle': 0,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    babelOptions: {
      configFile: './.babelrc-eslint',
    },
  },
  settings: {
    jsdoc: {
      mode: 'typescript',
    },
  },
};
