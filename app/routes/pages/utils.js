function isObjectWithKeys(target, keys = []) {
  const isObject = Object.prototype.toString.call(target) === '[object Object]';
  let hasKeys = true;
  if (isObject) {
    keys.forEach((k) => {
      hasKeys = hasKeys && Object.prototype.hasOwnProperty.call(target, k);
    });
  }
  return isObject && hasKeys;
}

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
function executeHook(logger, req, res, pageMeta, hookName) {
  return new Promise((resolve) => {
    const hooks = pageMeta && pageMeta.hooks ? pageMeta.hooks : {};
    if (typeof hooks[hookName] === 'function') {
      logger.trace('Run %s hook for %s', hookName, req.journeyWaypointId);
      hooks[hookName](req, res, () => {
        // Will not resolve if hook executes `res.send()`
        resolve();
      });
    } else {
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
    return {};
  }

  // Prune data that does not have an associated field valdiator
  const prunedData = {};
  Object.keys(fieldValidators).forEach((k) => {
    if (typeof data[k] !== 'undefined') {
      prunedData[k] = data[k];
    }
  });

  return prunedData;
}

/**
 * This does the opposite of objectPathValue
 * it set the value of the propeerty field in the pageData object to value.
 *
 * objectPathValue uses the module object-resolve-path to do a sort of home made hacky xpath
 * to get a value given a path. Problem is that it only gets the value and does not export a
 * way of getting the path or setting the value at the path.
 * So this is a hacky fix for that
 *
 * For the basic gatherModifiers the field will be the same as the path so it should be ok
 * need more work on this.
 *
 * @param {object} logger Logger
 * @param {object} pageData Page data
 * @param {string} field Field to replace
 * @param {mixed} value Value to apply
 * @return {void}
 */
function replaceObjectPathValue(logger, pageData, field, value) {
  try {
    // const pageData2 = pageData;
    // pageData2[field] = value;
    Object.assign(pageData, {
      [field]: value,
    });
  } catch (err) {
    logger.debug('Exception in replaceObjectPathValue: %s', err.message);
  }
}

module.exports = {
  executeHook,
  extractSessionableData,
  replaceObjectPathValue,
};
