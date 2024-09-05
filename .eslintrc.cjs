module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "@dwp/eslint-config-base",
    "plugin:import/recommended",
    "plugin:sonarjs/recommended",
    "plugin:security/recommended-legacy",
  ],
  plugins: ["import", "jsdoc", "sonarjs", "security"],
  rules: {
    semi: [0],
    "sonarjs/cognitive-complexity": [1],
    "jsdoc/require-description-complete-sentence": 0,
    "import/extensions": 0,
    "no-underscore-dangle": 0,
  },
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    babelOptions: {
      configFile: "./.babelrc-eslint",
    },
  },
  settings: {
    jsdoc: {
      mode: "typescript",
    },
  },
};
