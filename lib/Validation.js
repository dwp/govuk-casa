/**
 * @deprecated Do not use this file in new applications.
 *
 * Use this instead:
 * const {
 *   validationRules,
 *   validationProcessor,
 *   arrayObjectFieldValidation,
 *   objectFieldValidation,
 *   simpleFieldValidation
 * } = require('@dwp/govuk-casa');
 */

const util = require('util');
const validation = require('./validation/index.js');

module.exports = util.deprecate(
  () => (validation),
  '@dwp/govuk-casa/lib/Validation should be replaced with "const { validationRules, validationProcessor, arrayObjectFieldValidation, objectFieldValidation, simpleFieldValidation } = require(\'@dwp/govuk-casa\')"',
)();
