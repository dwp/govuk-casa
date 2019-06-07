/**
 * @deprecated Do not use this file in new applications.
 *
 * Use this instead:
 * const { gatherModifiers } = require('@dwp/govuk-casa');
 */

const util = require('util');
const gatherModifiers = require('./gather-modifiers/index.js');

module.exports = util.deprecate(
  () => (gatherModifiers),
  '@dwp/govuk-casa/lib/GatherModifiers.js is deprecated. Gather-Modifier functions are now accessed via \'require("@dwp/govuk-casa").gatherModifiers\'.',
)();
