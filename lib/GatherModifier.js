const npath = require('path');
const fs = require('fs');

/* ------------------------------------------------------------------- module */

/**
 * GatherModifiers logic common to 90% of the data passing through the application.
 *
 * Standard gatherModifiers are defined in the same way as field-validators,
 * one munger function per file stored in the gatherModifiers sub-dir
 *
 * @return {Array} list of gatherers
 */
function libGatherModifier() {
  // Load all core validation gatherModifiers (from `./validation-gatherModifiers`) into scope
  const gatherModifiers = {};
  const gatherModifiersPath = npath.resolve(__dirname, 'gather-modifiers');

  fs.readdirSync(gatherModifiersPath).forEach((file) => {
    if (npath.extname(file) === '.js') {
      const ruleName = npath.basename(file, '.js');
      const rulePath = npath.resolve(gatherModifiersPath, file);
      /* eslint-disable-next-line global-require,import/no-dynamic-require */
      gatherModifiers[ruleName] = require(rulePath);
    }
  });

  return gatherModifiers;
}

module.exports = libGatherModifier();
