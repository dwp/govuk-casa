module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "@dwp/eslint-config-base",
    "plugin:import/recommended",
    "plugin:sonarjs/recommended",
    "plugin:security/recommended",
  ],
  plugins: ["import", "jsdoc", "no-unsafe-regex", "sonarjs", "security"],
  rules: {
    // indent: [2, 2],
    semi: [0],
    "sonarjs/cognitive-complexity": [1],
    "jsdoc/require-description-complete-sentence": 0,
    "no-unsafe-regex/no-unsafe-regex": 2,
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
