const { isObjectWithKeys } = require('../../lib/Util.js');

/**
 * Generic wrapper for executing one of the page hooks.
 *
 * The returned Promise will always resolve unless the hook function ends the
 * response with something like `res.send()`.
 *
 * @param  {Logger} logger Request-specific Logger instance
 * @param  {request} req Express request
 * @param  {response} res Express response
 * @param  {object} pageMeta Metadata of page being processed
 * @param  {string} hookName Name of hook to execute
 * @return {Promise} Promise
 */
function executeHook(logger, req = {}, res = {}, pageMeta = {}, hookName = '') {
  return new Promise((resolve, reject) => {
    const hooks = pageMeta && pageMeta.hooks ? pageMeta.hooks : Object.create(null);
    const journeyWaypointId = req.casa.journeyWaypointId || '';
    if (typeof hooks[hookName] === 'function') {
      logger.trace('Run %s hook for %s', hookName, journeyWaypointId);
      hooks[hookName](req, res, (err) => {
        // Will not resolve if hook executes `res.send()`
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      logger.trace('No %s hook for %s', hookName, journeyWaypointId);
      resolve();
    }
  });
}

/**
 * Extract the data that will be saved to session, removing data that does not
 * have an associated field validator.
 *
 * Where no validators are defined for the requested waypoint, we will store
 * nothing in the session.
 *
 * @param {Logger} logger Request-specific logger instance
 * @param {string} pageWaypointId Waypoint ID
 * @param {object} fieldValidators List of validators (indexed by field name)
 * @param {object} data Data to be pruned
 * @returns {object} The pruned data
 * @throws {TypeError} When
 */
function extractSessionableData(logger, pageWaypointId, fieldValidators = {}, data = {}) {
  if (!isObjectWithKeys(logger, ['warn'])) {
    throw new TypeError('Expected logger to be a configured logging object');
  }

  if (typeof pageWaypointId !== 'string') {
    throw new TypeError('Expected pageWaypointId to be a string');
  }

  if (!isObjectWithKeys(fieldValidators)) {
    throw new TypeError('Expected fieldValidators to be an object');
  }

  if (!isObjectWithKeys(data)) {
    throw new TypeError('Expected data to be an object');
  }

  if (Object.keys(fieldValidators).length === 0) {
    logger.warn(
      'No field validators defined for "%s" waypoint. Will use an empty object.',
      pageWaypointId,
    );
    return Object.create(null);
  }

  // Prune data that does not have an associated field valdiator
  const prunedData = Object.create(null);
  Object.keys(fieldValidators).forEach((k) => {
    if (typeof data[k] !== 'undefined') {
      prunedData[k] = data[k];
    }
  });

  return prunedData;
}

/**
 * Run modifying functions against the specified field.
 *
 * @param {object} fieldValue Value to modify
 * @param {array|function} gatherModifiers Either an array of functions or a single function
 * @return {mixed} Modified value
 */
function runGatherModifiers(fieldValue, gatherModifiers = []) {
  const modifiers = Array.isArray(gatherModifiers) ? gatherModifiers : [gatherModifiers];

  let fValue = fieldValue;
  modifiers.forEach((m) => {
    fValue = typeof m === 'function' ? m({
      fieldValue: fValue,
    }) : fValue;
  });

  return fValue;
}

module.exports = {
  executeHook,
  extractSessionableData,
  runGatherModifiers,
};
