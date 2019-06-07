/**
 * @deprecated Do not use this file in new applications.
 *
 * Use this instead:
 * const { configure } = require('@dwp/govuk-casa');
 */

const util = require('util');
const { configure } = require('./casa.js');

module.exports = util.deprecate(
  () => (configure),
  '@dwp/govuk-casa now exports an object of APIs rather than a single bootstrap function. Use \'require("@dwp/govuk-casa").configure()\' instead.',
)();
