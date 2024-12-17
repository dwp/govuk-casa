import dwpConfig from "@dwp/eslint-config-base";
import securityPlugin from "eslint-plugin-security";
import jsdocsPlugin from "eslint-plugin-jsdoc";
import sonarjsPlugin from "eslint-plugin-sonarjs";

export default [
  ...dwpConfig,
  securityPlugin.configs.recommended,
  jsdocsPlugin.configs["flat/recommended"],
  sonarjsPlugin.configs.recommended,
  {
    rules: {
      // "jsdoc/require-description-complete-sentence": "off",
      "jsdoc/tag-lines": ["warn", "any", {"startLines": 1}],
      "sonarjs/todo-tag": "warn",
    },
  },
  {
    name: "Global ignore list",
    ignores: [
      "assets/**/*",
      "dist/**/*",
      "examples/**/*",
      "scripts/**/*",
      "docs/api/**/*",
    ],
  },
  {
    name: "Test files",
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        it: "readonly",
        describe: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
    rules: {
      "sonarjs/no-nested-functions": "off",
    }
  },
];