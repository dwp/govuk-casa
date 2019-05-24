const { objectPathValue } = require('../../../../lib/Util.js');
const { replaceObjectPathValue } = require('../utils.js');

/**
 * Add a validator object to the processing queue.
 *
 * @param  {object} pageData Full page data from which data is extracted
 * @param  {string} field Field to validate (in square-brace notation)
 * @param  {array or function} gatherModifiers, either an array of functions or a single function
 * @return {void}
 */
/* eslint-disable-next-line consistent-return,require-jsdoc */
function runGatherModifiers(logger, pageData, field, gatherModifiers) {
  const modifiers = typeof gatherModifiers === 'function' ? [gatherModifiers] : gatherModifiers;
  if (Array.isArray(modifiers)) {
    let fieldValue = objectPathValue(pageData, field);
    modifiers.forEach((m) => {
      fieldValue = m({ fieldValue });
    });
    replaceObjectPathValue(logger, pageData, field, fieldValue);
  }
}

/**
 * GatherModifier the data using the page's defined field gatherModifiers.
 *
 *
 * @param {Logger} logger Request-specific logger instance
 * @param {string} waypointId The waypoint ID being processed
 * @param {object} postData Express request object
 * @param {object} pageMeta Metadata of page being evalutated
 * @return {Promise} Promise (always resolves, unless hook intercepts)
 */
function doGatherDataModification(logger, waypointId, postData, pageMeta) {
  if (pageMeta && pageMeta.fieldGatherModifiers) {
    logger.trace('Run gather-modifier for %s', waypointId);

    Object.keys(pageMeta.fieldGatherModifiers).forEach((field) => {
      runGatherModifiers(logger, postData, field, pageMeta.fieldGatherModifiers[field]);
    });
  }
  return postData;
}

module.exports = {
  doGatherDataModification,
  runGatherModifiers,
};
